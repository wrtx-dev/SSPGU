package main

import (
	"context"
	"embed"
	"fmt"
	"runtime"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed all:ui/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()
	serial := NewSerial()

	err := app.initConfig()
	if err != nil {
		fmt.Println("init config error:", err)
	}

	isMacOS := runtime.GOOS == "darwin"
	appMenu := menu.NewMenu()

	if isMacOS {
		appMenu.Append(menu.AppMenu())
		// appMenu.Append(menu.EditMenu())
		// appMenu.Append(menu.WindowMenu())
	}

	// Create application with options
	err = wails.Run(&options.App{
		Title:     "SSPGU",
		Width:     880,
		Height:    600,
		MinWidth:  880,
		MinHeight: 600,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour:         &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		Menu:                     appMenu,
		EnableDefaultContextMenu: true,
		OnStartup: func(ctx context.Context) {
			app.startup(ctx)
			serial.startup(ctx)
		},
		StartHidden: true,
		Mac: &mac.Options{
			TitleBar:             mac.TitleBarHiddenInset(),
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			Appearance:           mac.DefaultAppearance,
		},
		HideWindowOnClose: isMacOS,
		Bind: []interface{}{
			app,
			serial,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
