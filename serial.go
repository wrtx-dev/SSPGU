package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"sync"
	"time"

	r "github.com/wailsapp/wails/v2/pkg/runtime"
	"github.com/xiwh/zmodem/byteutil"
	"github.com/xiwh/zmodem/zmodem"
	"go.bug.st/serial"
)

const (
	modeString = iota
	modeHex
)

type Serial struct {
	port             serial.Port
	ctx              context.Context
	ports            []string
	lock             sync.Mutex
	isWatcherRunning bool
	isReaderRunning  bool
	mode             int
	zm               *zmodem.ZModem
	saveFile         string
	event            string
	cmdWriter        *byteutil.BlockBuffer
	withZmodem       bool
}

type TransEventStart struct {
	IsDown bool   `json:"isdown"`
	Name   string `json:"name"`
	Size   int    `json:"size"`
}

type TransEventInfo struct {
	Size int `json:"size"`
}

func NewSerial() *Serial {
	s := Serial{mode: modeString}
	s.newZmodemInstance()
	return &s
}

func (s *Serial) newZmodemInstance() {
	s.cmdWriter = byteutil.NewBlockReadWriter(4096)
	zm := zmodem.New(zmodem.ZModemConsumer{
		OnUploadSkip: func(file *zmodem.ZModemFile) {
			println(fmt.Sprintf("send file:%s skip", file.Filename))
		},
		OnUpload: func() *zmodem.ZModemFile {
			uploadName, err := r.OpenFileDialog(s.ctx, r.OpenDialogOptions{})
			if err != nil {
				return nil
			}
			zfile, err := zmodem.NewZModemLocalFile(uploadName)
			if err != nil {
				return nil
			}
			wrapper := newFileWrapper(zfile.GetBuf())
			wrapper.close = func() {
				r.EventsEmit(s.ctx, "TransFinished")
			}
			wrapper.read = func(n int) {
				r.EventsEmit(s.ctx, "UpdateTransInfo", TransEventInfo{
					Size: n,
				})
			}
			zfile.ChangeBuf(wrapper)
			r.EventsEmit(s.ctx, "OpenTransDialog", TransEventStart{
				IsDown: false,
				Name:   zfile.Filename,
				Size:   zfile.Size,
			})
			return zfile
		},
		OnCheckDownload: func(file *zmodem.ZModemFile) {
			saveFile, err := r.SaveFileDialog(s.ctx, r.SaveDialogOptions{
				CanCreateDirectories: true,
				Title:                file.Filename,
				DefaultFilename:      file.Filename,
			})
			if err != nil {
				file.Skip()
			}
			if saveFile == "" {
				file.Skip()
			}
			s.saveFile = saveFile
		},
		OnDownload: func(file *zmodem.ZModemFile, reader io.ReadCloser) error {
			f, err := os.OpenFile(s.saveFile, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, os.ModePerm)
			if err != nil {
				return err
			}
			defer f.Close()
			// _, err := io.Copy(f, reader)
			r.EventsEmit(s.ctx, "OpenTransDialog", TransEventStart{
				IsDown: true,
				Name:   s.saveFile,
				Size:   file.Size,
			})
			buf := make([]byte, 4096)
			for {
				n := 0
				n, err = reader.Read(buf)
				if err != nil && err != io.EOF {
					println(fmt.Sprintf("receive file:%s failed:%s", file.Filename, err.Error()))
					break
				}
				cnt := 0
				for {
					wn, err := f.Write(buf[:n])
					if err != nil {
						return err
					}
					cnt += wn

					if wn >= n {
						break
					}
				}
				r.EventsEmit(s.ctx, "UpdateTransInfo", TransEventInfo{
					Size: n,
				})
				if err == io.EOF {
					break
				}
			}
			if err == nil {
				r.EventsEmit(s.ctx, "TransFinished")
				println(fmt.Sprintf("receive file:%s sucesss", file.Filename))
			} else {
				r.EventsEmit(s.ctx, "TransFinished")
				println(fmt.Sprintf("receive file:%s failed:%s", file.Filename, err.Error()))
			}
			return err
		},
		Writer:     s.cmdWriter,
		EchoWriter: s,
	})
	s.zm = zm
	go func() {
		buf := make([]byte, 4096)
		for {
			port := s.port
			n, err := s.cmdWriter.Read(buf)
			if err != nil {
				break
			}
			wc := 0
			if port == nil {
				continue
			}
			for {
				wn, err := port.Write(buf[wc:n])
				if err != nil {
					break
				}
				wc += wn

				if wn > 0 {
					r.EventsEmit(s.ctx, "UpdateTX", n)
				}
				if wc >= n {
					break
				}
			}
		}
	}()
}

func (s *Serial) GetSerialPorts() ([]string, error) {
	return serial.GetPortsList()
}

func (s *Serial) SetWriteMode(mode int) {
	s.lock.Lock()
	defer s.lock.Unlock()
	s.mode = mode
}
func (s *Serial) StartPortsWatcher() {
	s.lock.Lock()
	defer s.lock.Unlock()
	if s.isWatcherRunning {
		return
	}
	go func() {
		s.isWatcherRunning = true
		for {
			ports, err := serial.GetPortsList()
			if err == nil {

				if s.ports == nil || len(s.ports) != len(ports) {
					s.ports = ports
					fmt.Println("new ports:", ports)
					r.EventsEmit(s.ctx, "UpdataUartPort", s.ports)
				} else {
					foundNew := false
					for _, port := range ports {
						found := false
						for _, oldport := range s.ports {
							if port == oldport {
								found = true
								break
							}
						}
						if !found {
							foundNew = true
							break
						}
					}
					if foundNew {
						s.ports = ports
						println("found new uart port")
						r.EventsEmit(s.ctx, "UpdataUartPort", s.ports)
					}
				}
			} else {
				println("get ports err:", err)
			}
			time.Sleep(1 * time.Second)
		}
	}()
}

func (s *Serial) startup(ctx context.Context) {
	s.ctx = ctx
}

func (s *Serial) OpenSerialPort(serialPort string, baud int, dataBit int, stopBit serial.StopBits, parity string, withZmodem bool) (bool, error) {
	sparity := serial.NoParity
	switch parity {
	case "Even":
		sparity = serial.EvenParity
	case "Odd":
		sparity = serial.OddParity
	case "None":
		sparity = serial.NoParity
	default:
		return false, fmt.Errorf("unsupport parity")
	}

	s.withZmodem = withZmodem

	mode := serial.Mode{
		BaudRate: baud,
		DataBits: dataBit,
		StopBits: stopBit,
		Parity:   sparity,
	}
	port, err := serial.Open(serialPort, &mode)
	if err != nil {
		return false, err
	}
	s.port = port
	return true, nil
}

func (s *Serial) Write(p []byte) (n int, err error) {
	if s.event != "" {
		r.EventsEmit(s.ctx, s.event, p)
	}
	return len(p), nil
}

func (s *Serial) ClosePort() {
	s.lock.Lock()
	defer s.lock.Unlock()
	s.isReaderRunning = false
	s.port.Close()
	fmt.Println("close serial port")
	s.port = nil
}

func (s *Serial) StartRead(eventName string) error {
	if eventName == "" {
		return fmt.Errorf("%s", "Event Name can't be empty")
	}
	s.lock.Lock()
	defer s.lock.Unlock()
	s.event = eventName
	if s.isReaderRunning {
		return nil
	}
	if s.port == nil {
		return fmt.Errorf("open uart first")
	}
	fmt.Println("start go func")
	go func() {
		buf := make([]byte, 4096)
		fmt.Println("start reader")
		port := s.port
		for {
			n, err := port.Read(buf)
			if n > 0 {
				r.EventsEmit(s.ctx, "UpdateRX", n)
			}
			if err != nil {
				s.lock.Lock()
				fmt.Println("read uart port err:", err, "break", "is running:", s.isReaderRunning)
				if s.isReaderRunning {
					r.EventsEmit(s.ctx, "SerialErr", fmt.Sprintf("read uart port err: %v", err))
				}
				s.lock.Unlock()
				break
			} else {
				if s.zm != nil && s.withZmodem {
					_, err := s.zm.Write(buf[:n])
					if err != nil {
						fmt.Println("zm writer error:", err)
					}
					continue
				}
				r.EventsEmit(s.ctx, eventName, buf[:n])
			}

		}
		fmt.Println("exited reader")
		s.lock.Lock()
		defer s.lock.Unlock()
		fmt.Println("reset reader running stats")
		s.isReaderRunning = false

	}()
	s.isReaderRunning = true
	return nil
}

func (s *Serial) WriteToPort(data []byte) error {
	s.lock.Lock()
	defer s.lock.Unlock()
	if s.port == nil {
		return fmt.Errorf("uart port closed")
	}
	if s.cmdWriter != nil {
		_, err := s.cmdWriter.Write(data)
		if err != nil {
			fmt.Println("cmd writer write err:", err)
		}
		return err

	}
	n, err := s.port.Write(data)
	if n > 0 {
		r.EventsEmit(s.ctx, "UpdateTX", n)
	}
	if err != nil {
		return err
	}

	return nil
}
