package main

import (
	"context"
	"fmt"
	"os"
	"path"

	r "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) getConfigDir() (string, error) {
	userDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return path.Join(userDir, ".goUartConfig"), nil
}
func (a *App) ReadGlobalConfig() (string, error) {
	configDir, err := a.getConfigDir()
	if err != nil {
		return "", err
	}
	config, err := os.ReadFile(path.Join(configDir, "config.json"))
	if err != nil {
		return "", err
	}
	return string(config), nil
}

func (a *App) initConfig() error {
	userDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	configDir := path.Join(userDir, ".goUartConfig")
	if _, err := os.Stat(configDir); err != nil {
		fmt.Println("stat config dir:", configDir, "err:", err)
		if !os.IsNotExist(err) {
			return err
		}
		fmt.Println("create new config dir")
		err = os.Mkdir(configDir, 0777)
		if err != nil {
			return err
		}
	}
	configPath := path.Join(configDir, "config.json")
	if _, err := os.Stat(configPath); err != nil {
		if !os.IsNotExist(err) {
			return err
		}
		fd, err := os.Create(configPath)
		if err != nil {
			return err
		}
		defer fd.Close()
	}
	return nil
}

func (a *App) SaveConfig(config string) error {
	configDir, err := a.getConfigDir()
	if err != nil {
		return err
	}
	configFile := path.Join(configDir, "config.json")
	return os.WriteFile(configFile, []byte(config), 0755)
}

func (a *App) SaveFile(data string) (bool, error) {
	filters := []r.FileFilter{
		{
			DisplayName: "Log Files (*.log)",
			Pattern:     "*.log",
		},
		{
			DisplayName: "Text Files (*.txt)",
			Pattern:     "*.txt",
		},
		{
			DisplayName: "All Files (*.*)",
			Pattern:     "*.*",
		},
	}

	savePath, err := r.SaveFileDialog(a.ctx, r.SaveDialogOptions{
		DefaultFilename: "unamed.log",
		Filters:         filters,
	})

	if err != nil {
		return false, nil
	}

	if savePath == "" {
		return false, nil
	}

	if err = os.WriteFile(savePath, []byte(data), 0755); err != nil {
		return false, err
	} else {
		return true, nil
	}
}
