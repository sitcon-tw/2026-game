package main

import (
	"fmt"
	"net/http"

	swaggerDocs "github.com/sitcon-tw/2026-game/docs"

	scalar "github.com/MarceloPetrucio/go-scalar-api-reference"
)

func main() {
	mux := http.NewServeMux()
	mux.Handle("/docs", scalarDocsHandler())
	
	fmt.Print("嗨嗨，你的 docs 跑在 http://localhost:8000/docs 喔，記得你現在的東西只有文檔，是沒有任何後端在跑的喔，他只是個 html owo")
	http.ListenAndServe(fmt.Sprintf(":%s", "8000"), mux)
}
func scalarDocsHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		html, err := scalar.ApiReferenceHTML(&scalar.Options{
			SpecContent: swaggerDocs.SwaggerInfo.ReadDoc(),
			CustomOptions: scalar.CustomOptions{
				PageTitle: "SITGAME API Reference",
			},
			DarkMode: true,
		})
		if err != nil {
			http.Error(w, "could not render API reference", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(html))
	}
}
