package health

import (
	"fmt"
	"net/http"
	"os"
	"time"
)

func MaybeProbe(port, path string) {
	if len(os.Args) < 2 || os.Args[1] != "healthcheck" {
		return
	}

	url := fmt.Sprintf("http://127.0.0.1:%s%s", port, path)
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		fmt.Fprintln(os.Stderr, "healthcheck:", err)
		os.Exit(1)
	}
	_ = resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 400 {
		os.Exit(0)
	}
	fmt.Fprintf(os.Stderr, "healthcheck: unhealthy (status %d)\n", resp.StatusCode)
	os.Exit(1)
}
