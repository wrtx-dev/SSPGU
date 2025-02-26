package main

import (
	"io"
)

type onClose func()
type onRead func(int)
type onWrite func(int)
type fileWrapper struct {
	fp    io.ReadWriteCloser
	close onClose
	read  onRead
	write onWrite
}

func newFileWrapper(fp io.ReadWriteCloser) fileWrapper {
	return fileWrapper{
		fp:    fp,
		close: nil,
		read:  nil,
		write: nil,
	}
}

func (f fileWrapper) Close() error {
	if f.close != nil {
		f.close()
	}
	return f.fp.Close()
}

func (f fileWrapper) Read(p []byte) (int, error) {
	n, err := f.fp.Read(p)
	println("read", n, "bytes")
	if f.read != nil {
		f.read(n)
	}
	return n, err
}

func (f fileWrapper) Write(p []byte) (int, error) {
	return f.fp.Write(p)

}
