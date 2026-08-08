package gen

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/oapi-codegen/runtime"
)

type ArtifactResponse struct {
	Checksum    string `json:"checksum"`
	CreatedAt   string `json:"created_at"`
	Description string `json:"description"`
	FileSize    int64  `json:"file_size"`
	MimeType    string `json:"mime_type"`
	Name        string `json:"name"`
	Public      bool   `json:"public"`
	SiteKey     string `json:"site_key"`
	Status      int64  `json:"status"`
	Uuid        string `json:"uuid"`
}

type CompleteUploadRequest struct {
	Schema   *string          `json:"$schema,omitempty"`
	Manifest *ManifestInput   `json:"manifest,omitempty"`
	Parts    *[]CompletedPart `json:"parts,omitempty"`
}

type CompletedPart struct {
	Etag       string `json:"etag"`
	PartNumber int32  `json:"part_number"`
}

type DeleteData struct {
	Deleted bool   `json:"deleted"`
	Uuid    string `json:"uuid"`
}

type DownloadResponse struct {
	ExpiresAt *string `json:"expires_at,omitempty"`
	Url       string  `json:"url"`
}

type EnvelopeArtifactResponse struct {
	Schema  *string           `json:"$schema,omitempty"`
	Code    int64             `json:"code"`
	Data    *ArtifactResponse `json:"data,omitempty"`
	Message string            `json:"message"`
}

type EnvelopeDeleteData struct {
	Schema  *string     `json:"$schema,omitempty"`
	Code    int64       `json:"code"`
	Data    *DeleteData `json:"data,omitempty"`
	Message string      `json:"message"`
}

type EnvelopeDownloadResponse struct {
	Schema  *string           `json:"$schema,omitempty"`
	Code    int64             `json:"code"`
	Data    *DownloadResponse `json:"data,omitempty"`
	Message string            `json:"message"`
}

type EnvelopeInitUploadResponse struct {
	Schema  *string             `json:"$schema,omitempty"`
	Code    int64               `json:"code"`
	Data    *InitUploadResponse `json:"data,omitempty"`
	Message string              `json:"message"`
}

type EnvelopeListData struct {
	Schema  *string   `json:"$schema,omitempty"`
	Code    int64     `json:"code"`
	Data    *ListData `json:"data,omitempty"`
	Message string    `json:"message"`
}

type HouseError struct {
	Schema  *string `json:"$schema,omitempty"`
	Code    int64   `json:"code"`
	Message string  `json:"message"`
}

type InitUploadRequest struct {
	Schema      *string `json:"$schema,omitempty"`
	Checksum    *string `json:"checksum,omitempty"`
	Description *string `json:"description,omitempty"`
	FileSize    int64   `json:"file_size"`
	MimeType    *string `json:"mime_type,omitempty"`
	Name        string  `json:"name"`
	Public      *bool   `json:"public,omitempty"`
	UploaderSub *string `json:"uploader_sub,omitempty"`
}

type InitUploadResponse struct {
	ExpiresAt string     `json:"expires_at"`
	Multipart bool       `json:"multipart"`
	PartSize  *int64     `json:"part_size,omitempty"`
	PartUrls  *[]PartURL `json:"part_urls,omitempty"`
	UploadId  *string    `json:"upload_id,omitempty"`
	UploadUrl *string    `json:"upload_url,omitempty"`
	Uuid      string     `json:"uuid"`
}

type ListData struct {
	Items *[]ArtifactResponse `json:"items"`
	Total int64               `json:"total"`
}

type ManifestInput struct {
	Arguments    *string                 `json:"arguments,omitempty"`
	Executable   string                  `json:"executable"`
	Requirements *map[string]interface{} `json:"requirements,omitempty"`
	SavePath     *string                 `json:"save_path,omitempty"`
	WorkingDir   *string                 `json:"working_dir,omitempty"`
}

type PartURL struct {
	PartNumber int32  `json:"part_number"`
	Url        string `json:"url"`
}

type ListArtifactsParams struct {
	Page *int64 `form:"page,omitempty" json:"page,omitempty"`

	PageSize *int64 `form:"page_size,omitempty" json:"page_size,omitempty"`
}

type InitUploadJSONRequestBody = InitUploadRequest

type CompleteUploadJSONRequestBody = CompleteUploadRequest

type RequestEditorFn func(ctx context.Context, req *http.Request) error

type HttpRequestDoer interface {
	Do(req *http.Request) (*http.Response, error)
}

type Client struct {
	Server string

	Client HttpRequestDoer

	RequestEditors []RequestEditorFn
}

type ClientOption func(*Client) error

func NewClient(server string, opts ...ClientOption) (*Client, error) {
	client := Client{
		Server: server,
	}
	for _, o := range opts {
		if err := o(&client); err != nil {
			return nil, err
		}
	}
	if !strings.HasSuffix(client.Server, "/") {
		client.Server += "/"
	}
	if client.Client == nil {
		client.Client = &http.Client{}
	}
	return &client, nil
}

func WithHTTPClient(doer HttpRequestDoer) ClientOption {
	return func(c *Client) error {
		c.Client = doer
		return nil
	}
}

func WithRequestEditorFn(fn RequestEditorFn) ClientOption {
	return func(c *Client) error {
		c.RequestEditors = append(c.RequestEditors, fn)
		return nil
	}
}

type ClientInterface interface {
	ListArtifacts(ctx context.Context, params *ListArtifactsParams, reqEditors ...RequestEditorFn) (*http.Response, error)

	InitUploadWithBody(ctx context.Context, contentType string, body io.Reader, reqEditors ...RequestEditorFn) (*http.Response, error)

	InitUpload(ctx context.Context, body InitUploadJSONRequestBody, reqEditors ...RequestEditorFn) (*http.Response, error)

	DeleteArtifact(ctx context.Context, uuid string, reqEditors ...RequestEditorFn) (*http.Response, error)

	GetArtifact(ctx context.Context, uuid string, reqEditors ...RequestEditorFn) (*http.Response, error)

	CompleteUploadWithBody(ctx context.Context, uuid string, contentType string, body io.Reader, reqEditors ...RequestEditorFn) (*http.Response, error)

	CompleteUpload(ctx context.Context, uuid string, body CompleteUploadJSONRequestBody, reqEditors ...RequestEditorFn) (*http.Response, error)

	DownloadArtifact(ctx context.Context, uuid string, reqEditors ...RequestEditorFn) (*http.Response, error)
}

func (c *Client) ListArtifacts(ctx context.Context, params *ListArtifactsParams, reqEditors ...RequestEditorFn) (*http.Response, error) {
	req, err := NewListArtifactsRequest(c.Server, params)
	if err != nil {
		return nil, err
	}
	req = req.WithContext(ctx)
	if err := c.applyEditors(ctx, req, reqEditors); err != nil {
		return nil, err
	}
	return c.Client.Do(req)
}

func (c *Client) InitUploadWithBody(ctx context.Context, contentType string, body io.Reader, reqEditors ...RequestEditorFn) (*http.Response, error) {
	req, err := NewInitUploadRequestWithBody(c.Server, contentType, body)
	if err != nil {
		return nil, err
	}
	req = req.WithContext(ctx)
	if err := c.applyEditors(ctx, req, reqEditors); err != nil {
		return nil, err
	}
	return c.Client.Do(req)
}

func (c *Client) InitUpload(ctx context.Context, body InitUploadJSONRequestBody, reqEditors ...RequestEditorFn) (*http.Response, error) {
	req, err := NewInitUploadRequest(c.Server, body)
	if err != nil {
		return nil, err
	}
	req = req.WithContext(ctx)
	if err := c.applyEditors(ctx, req, reqEditors); err != nil {
		return nil, err
	}
	return c.Client.Do(req)
}

func (c *Client) DeleteArtifact(ctx context.Context, uuid string, reqEditors ...RequestEditorFn) (*http.Response, error) {
	req, err := NewDeleteArtifactRequest(c.Server, uuid)
	if err != nil {
		return nil, err
	}
	req = req.WithContext(ctx)
	if err := c.applyEditors(ctx, req, reqEditors); err != nil {
		return nil, err
	}
	return c.Client.Do(req)
}

func (c *Client) GetArtifact(ctx context.Context, uuid string, reqEditors ...RequestEditorFn) (*http.Response, error) {
	req, err := NewGetArtifactRequest(c.Server, uuid)
	if err != nil {
		return nil, err
	}
	req = req.WithContext(ctx)
	if err := c.applyEditors(ctx, req, reqEditors); err != nil {
		return nil, err
	}
	return c.Client.Do(req)
}

func (c *Client) CompleteUploadWithBody(ctx context.Context, uuid string, contentType string, body io.Reader, reqEditors ...RequestEditorFn) (*http.Response, error) {
	req, err := NewCompleteUploadRequestWithBody(c.Server, uuid, contentType, body)
	if err != nil {
		return nil, err
	}
	req = req.WithContext(ctx)
	if err := c.applyEditors(ctx, req, reqEditors); err != nil {
		return nil, err
	}
	return c.Client.Do(req)
}

func (c *Client) CompleteUpload(ctx context.Context, uuid string, body CompleteUploadJSONRequestBody, reqEditors ...RequestEditorFn) (*http.Response, error) {
	req, err := NewCompleteUploadRequest(c.Server, uuid, body)
	if err != nil {
		return nil, err
	}
	req = req.WithContext(ctx)
	if err := c.applyEditors(ctx, req, reqEditors); err != nil {
		return nil, err
	}
	return c.Client.Do(req)
}

func (c *Client) DownloadArtifact(ctx context.Context, uuid string, reqEditors ...RequestEditorFn) (*http.Response, error) {
	req, err := NewDownloadArtifactRequest(c.Server, uuid)
	if err != nil {
		return nil, err
	}
	req = req.WithContext(ctx)
	if err := c.applyEditors(ctx, req, reqEditors); err != nil {
		return nil, err
	}
	return c.Client.Do(req)
}

func NewListArtifactsRequest(server string, params *ListArtifactsParams) (*http.Request, error) {
	var err error

	serverURL, err := url.Parse(server)
	if err != nil {
		return nil, err
	}

	operationPath := fmt.Sprintf("/api/v1/artifacts")
	if operationPath[0] == '/' {
		operationPath = "." + operationPath
	}

	queryURL, err := serverURL.Parse(operationPath)
	if err != nil {
		return nil, err
	}

	if params != nil {
		queryValues := queryURL.Query()
		var rawQueryFragments []string

		if params.Page != nil {

			if queryFrag, err := runtime.StyleParamWithOptions("form", false, "page", *params.Page, runtime.StyleParamOptions{ParamLocation: runtime.ParamLocationQuery, Type: "integer", Format: "int64"}); err != nil {
				return nil, err
			} else {
				for _, qp := range strings.Split(queryFrag, "&") {
					rawQueryFragments = append(rawQueryFragments, qp)
				}
			}

		}

		if params.PageSize != nil {

			if queryFrag, err := runtime.StyleParamWithOptions("form", false, "page_size", *params.PageSize, runtime.StyleParamOptions{ParamLocation: runtime.ParamLocationQuery, Type: "integer", Format: "int64"}); err != nil {
				return nil, err
			} else {
				for _, qp := range strings.Split(queryFrag, "&") {
					rawQueryFragments = append(rawQueryFragments, qp)
				}
			}

		}

		if encoded := queryValues.Encode(); encoded != "" {
			rawQueryFragments = append(rawQueryFragments, encoded)
		}
		queryURL.RawQuery = strings.Join(rawQueryFragments, "&")
	}

	req, err := http.NewRequest(http.MethodGet, queryURL.String(), nil)
	if err != nil {
		return nil, err
	}

	return req, nil
}

func NewInitUploadRequest(server string, body InitUploadJSONRequestBody) (*http.Request, error) {
	var bodyReader io.Reader
	buf, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	bodyReader = bytes.NewReader(buf)
	return NewInitUploadRequestWithBody(server, "application/json", bodyReader)
}

func NewInitUploadRequestWithBody(server string, contentType string, body io.Reader) (*http.Request, error) {
	var err error

	serverURL, err := url.Parse(server)
	if err != nil {
		return nil, err
	}

	operationPath := fmt.Sprintf("/api/v1/artifacts")
	if operationPath[0] == '/' {
		operationPath = "." + operationPath
	}

	queryURL, err := serverURL.Parse(operationPath)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodPost, queryURL.String(), body)
	if err != nil {
		return nil, err
	}

	req.Header.Add("Content-Type", contentType)

	return req, nil
}

func NewDeleteArtifactRequest(server string, uuid string) (*http.Request, error) {
	var err error

	var pathParam0 string

	pathParam0, err = runtime.StyleParamWithOptions("simple", false, "uuid", uuid, runtime.StyleParamOptions{ParamLocation: runtime.ParamLocationPath, Type: "string", Format: ""})
	if err != nil {
		return nil, err
	}

	serverURL, err := url.Parse(server)
	if err != nil {
		return nil, err
	}

	operationPath := fmt.Sprintf("/api/v1/artifacts/%s", pathParam0)
	if operationPath[0] == '/' {
		operationPath = "." + operationPath
	}

	queryURL, err := serverURL.Parse(operationPath)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodDelete, queryURL.String(), nil)
	if err != nil {
		return nil, err
	}

	return req, nil
}

func NewGetArtifactRequest(server string, uuid string) (*http.Request, error) {
	var err error

	var pathParam0 string

	pathParam0, err = runtime.StyleParamWithOptions("simple", false, "uuid", uuid, runtime.StyleParamOptions{ParamLocation: runtime.ParamLocationPath, Type: "string", Format: ""})
	if err != nil {
		return nil, err
	}

	serverURL, err := url.Parse(server)
	if err != nil {
		return nil, err
	}

	operationPath := fmt.Sprintf("/api/v1/artifacts/%s", pathParam0)
	if operationPath[0] == '/' {
		operationPath = "." + operationPath
	}

	queryURL, err := serverURL.Parse(operationPath)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodGet, queryURL.String(), nil)
	if err != nil {
		return nil, err
	}

	return req, nil
}

func NewCompleteUploadRequest(server string, uuid string, body CompleteUploadJSONRequestBody) (*http.Request, error) {
	var bodyReader io.Reader
	buf, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	bodyReader = bytes.NewReader(buf)
	return NewCompleteUploadRequestWithBody(server, uuid, "application/json", bodyReader)
}

func NewCompleteUploadRequestWithBody(server string, uuid string, contentType string, body io.Reader) (*http.Request, error) {
	var err error

	var pathParam0 string

	pathParam0, err = runtime.StyleParamWithOptions("simple", false, "uuid", uuid, runtime.StyleParamOptions{ParamLocation: runtime.ParamLocationPath, Type: "string", Format: ""})
	if err != nil {
		return nil, err
	}

	serverURL, err := url.Parse(server)
	if err != nil {
		return nil, err
	}

	operationPath := fmt.Sprintf("/api/v1/artifacts/%s/complete", pathParam0)
	if operationPath[0] == '/' {
		operationPath = "." + operationPath
	}

	queryURL, err := serverURL.Parse(operationPath)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodPost, queryURL.String(), body)
	if err != nil {
		return nil, err
	}

	req.Header.Add("Content-Type", contentType)

	return req, nil
}

func NewDownloadArtifactRequest(server string, uuid string) (*http.Request, error) {
	var err error

	var pathParam0 string

	pathParam0, err = runtime.StyleParamWithOptions("simple", false, "uuid", uuid, runtime.StyleParamOptions{ParamLocation: runtime.ParamLocationPath, Type: "string", Format: ""})
	if err != nil {
		return nil, err
	}

	serverURL, err := url.Parse(server)
	if err != nil {
		return nil, err
	}

	operationPath := fmt.Sprintf("/api/v1/artifacts/%s/download", pathParam0)
	if operationPath[0] == '/' {
		operationPath = "." + operationPath
	}

	queryURL, err := serverURL.Parse(operationPath)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodGet, queryURL.String(), nil)
	if err != nil {
		return nil, err
	}

	return req, nil
}

func (c *Client) applyEditors(ctx context.Context, req *http.Request, additionalEditors []RequestEditorFn) error {
	for _, r := range c.RequestEditors {
		if err := r(ctx, req); err != nil {
			return err
		}
	}
	for _, r := range additionalEditors {
		if err := r(ctx, req); err != nil {
			return err
		}
	}
	return nil
}

type ClientWithResponses struct {
	ClientInterface
}

func NewClientWithResponses(server string, opts ...ClientOption) (*ClientWithResponses, error) {
	client, err := NewClient(server, opts...)
	if err != nil {
		return nil, err
	}
	return &ClientWithResponses{client}, nil
}

func WithBaseURL(baseURL string) ClientOption {
	return func(c *Client) error {
		newBaseURL, err := url.Parse(baseURL)
		if err != nil {
			return err
		}
		c.Server = newBaseURL.String()
		return nil
	}
}

type ClientWithResponsesInterface interface {
	ListArtifactsWithResponse(ctx context.Context, params *ListArtifactsParams, reqEditors ...RequestEditorFn) (*ListArtifactsResp, error)

	InitUploadWithBodyWithResponse(ctx context.Context, contentType string, body io.Reader, reqEditors ...RequestEditorFn) (*InitUploadResp, error)

	InitUploadWithResponse(ctx context.Context, body InitUploadJSONRequestBody, reqEditors ...RequestEditorFn) (*InitUploadResp, error)

	DeleteArtifactWithResponse(ctx context.Context, uuid string, reqEditors ...RequestEditorFn) (*DeleteArtifactResp, error)

	GetArtifactWithResponse(ctx context.Context, uuid string, reqEditors ...RequestEditorFn) (*GetArtifactResp, error)

	CompleteUploadWithBodyWithResponse(ctx context.Context, uuid string, contentType string, body io.Reader, reqEditors ...RequestEditorFn) (*CompleteUploadResp, error)

	CompleteUploadWithResponse(ctx context.Context, uuid string, body CompleteUploadJSONRequestBody, reqEditors ...RequestEditorFn) (*CompleteUploadResp, error)

	DownloadArtifactWithResponse(ctx context.Context, uuid string, reqEditors ...RequestEditorFn) (*DownloadArtifactResp, error)
}

type ListArtifactsResp struct {
	Body         []byte
	HTTPResponse *http.Response
	JSON200      *EnvelopeListData
	JSONDefault  *HouseError
}

func (r ListArtifactsResp) Status() string {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.Status
	}
	return http.StatusText(0)
}

func (r ListArtifactsResp) StatusCode() int {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.StatusCode
	}
	return 0
}

func (r ListArtifactsResp) ContentType() string {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.Header.Get("Content-Type")
	}
	return ""
}

type InitUploadResp struct {
	Body         []byte
	HTTPResponse *http.Response
	JSON200      *EnvelopeInitUploadResponse
	JSONDefault  *HouseError
}

func (r InitUploadResp) Status() string {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.Status
	}
	return http.StatusText(0)
}

func (r InitUploadResp) StatusCode() int {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.StatusCode
	}
	return 0
}

func (r InitUploadResp) ContentType() string {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.Header.Get("Content-Type")
	}
	return ""
}

type DeleteArtifactResp struct {
	Body         []byte
	HTTPResponse *http.Response
	JSON200      *EnvelopeDeleteData
	JSONDefault  *HouseError
}

func (r DeleteArtifactResp) Status() string {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.Status
	}
	return http.StatusText(0)
}

func (r DeleteArtifactResp) StatusCode() int {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.StatusCode
	}
	return 0
}

func (r DeleteArtifactResp) ContentType() string {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.Header.Get("Content-Type")
	}
	return ""
}

type GetArtifactResp struct {
	Body         []byte
	HTTPResponse *http.Response
	JSON200      *EnvelopeArtifactResponse
	JSONDefault  *HouseError
}

func (r GetArtifactResp) Status() string {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.Status
	}
	return http.StatusText(0)
}

func (r GetArtifactResp) StatusCode() int {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.StatusCode
	}
	return 0
}

func (r GetArtifactResp) ContentType() string {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.Header.Get("Content-Type")
	}
	return ""
}

type CompleteUploadResp struct {
	Body         []byte
	HTTPResponse *http.Response
	JSON200      *EnvelopeArtifactResponse
	JSONDefault  *HouseError
}

func (r CompleteUploadResp) Status() string {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.Status
	}
	return http.StatusText(0)
}

func (r CompleteUploadResp) StatusCode() int {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.StatusCode
	}
	return 0
}

func (r CompleteUploadResp) ContentType() string {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.Header.Get("Content-Type")
	}
	return ""
}

type DownloadArtifactResp struct {
	Body         []byte
	HTTPResponse *http.Response
	JSON200      *EnvelopeDownloadResponse
	JSONDefault  *HouseError
}

func (r DownloadArtifactResp) Status() string {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.Status
	}
	return http.StatusText(0)
}

func (r DownloadArtifactResp) StatusCode() int {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.StatusCode
	}
	return 0
}

func (r DownloadArtifactResp) ContentType() string {
	if r.HTTPResponse != nil {
		return r.HTTPResponse.Header.Get("Content-Type")
	}
	return ""
}

func (c *ClientWithResponses) ListArtifactsWithResponse(ctx context.Context, params *ListArtifactsParams, reqEditors ...RequestEditorFn) (*ListArtifactsResp, error) {
	rsp, err := c.ListArtifacts(ctx, params, reqEditors...)
	if err != nil {
		return nil, err
	}
	return ParseListArtifactsResp(rsp)
}

func (c *ClientWithResponses) InitUploadWithBodyWithResponse(ctx context.Context, contentType string, body io.Reader, reqEditors ...RequestEditorFn) (*InitUploadResp, error) {
	rsp, err := c.InitUploadWithBody(ctx, contentType, body, reqEditors...)
	if err != nil {
		return nil, err
	}
	return ParseInitUploadResp(rsp)
}

func (c *ClientWithResponses) InitUploadWithResponse(ctx context.Context, body InitUploadJSONRequestBody, reqEditors ...RequestEditorFn) (*InitUploadResp, error) {
	rsp, err := c.InitUpload(ctx, body, reqEditors...)
	if err != nil {
		return nil, err
	}
	return ParseInitUploadResp(rsp)
}

func (c *ClientWithResponses) DeleteArtifactWithResponse(ctx context.Context, uuid string, reqEditors ...RequestEditorFn) (*DeleteArtifactResp, error) {
	rsp, err := c.DeleteArtifact(ctx, uuid, reqEditors...)
	if err != nil {
		return nil, err
	}
	return ParseDeleteArtifactResp(rsp)
}

func (c *ClientWithResponses) GetArtifactWithResponse(ctx context.Context, uuid string, reqEditors ...RequestEditorFn) (*GetArtifactResp, error) {
	rsp, err := c.GetArtifact(ctx, uuid, reqEditors...)
	if err != nil {
		return nil, err
	}
	return ParseGetArtifactResp(rsp)
}

func (c *ClientWithResponses) CompleteUploadWithBodyWithResponse(ctx context.Context, uuid string, contentType string, body io.Reader, reqEditors ...RequestEditorFn) (*CompleteUploadResp, error) {
	rsp, err := c.CompleteUploadWithBody(ctx, uuid, contentType, body, reqEditors...)
	if err != nil {
		return nil, err
	}
	return ParseCompleteUploadResp(rsp)
}

func (c *ClientWithResponses) CompleteUploadWithResponse(ctx context.Context, uuid string, body CompleteUploadJSONRequestBody, reqEditors ...RequestEditorFn) (*CompleteUploadResp, error) {
	rsp, err := c.CompleteUpload(ctx, uuid, body, reqEditors...)
	if err != nil {
		return nil, err
	}
	return ParseCompleteUploadResp(rsp)
}

func (c *ClientWithResponses) DownloadArtifactWithResponse(ctx context.Context, uuid string, reqEditors ...RequestEditorFn) (*DownloadArtifactResp, error) {
	rsp, err := c.DownloadArtifact(ctx, uuid, reqEditors...)
	if err != nil {
		return nil, err
	}
	return ParseDownloadArtifactResp(rsp)
}

func ParseListArtifactsResp(rsp *http.Response) (*ListArtifactsResp, error) {
	bodyBytes, err := io.ReadAll(rsp.Body)
	defer func() { _ = rsp.Body.Close() }()
	if err != nil {
		return nil, err
	}

	response := &ListArtifactsResp{
		Body:         bodyBytes,
		HTTPResponse: rsp,
	}

	switch {
	case strings.Contains(rsp.Header.Get("Content-Type"), "json") && rsp.StatusCode == 200:
		var dest EnvelopeListData
		if err := json.Unmarshal(bodyBytes, &dest); err != nil {
			return nil, err
		}
		response.JSON200 = &dest

	case strings.Contains(rsp.Header.Get("Content-Type"), "json") && true:
		var dest HouseError
		if err := json.Unmarshal(bodyBytes, &dest); err != nil {
			return nil, err
		}
		response.JSONDefault = &dest

	}

	return response, nil
}

func ParseInitUploadResp(rsp *http.Response) (*InitUploadResp, error) {
	bodyBytes, err := io.ReadAll(rsp.Body)
	defer func() { _ = rsp.Body.Close() }()
	if err != nil {
		return nil, err
	}

	response := &InitUploadResp{
		Body:         bodyBytes,
		HTTPResponse: rsp,
	}

	switch {
	case strings.Contains(rsp.Header.Get("Content-Type"), "json") && rsp.StatusCode == 200:
		var dest EnvelopeInitUploadResponse
		if err := json.Unmarshal(bodyBytes, &dest); err != nil {
			return nil, err
		}
		response.JSON200 = &dest

	case strings.Contains(rsp.Header.Get("Content-Type"), "json") && true:
		var dest HouseError
		if err := json.Unmarshal(bodyBytes, &dest); err != nil {
			return nil, err
		}
		response.JSONDefault = &dest

	}

	return response, nil
}

func ParseDeleteArtifactResp(rsp *http.Response) (*DeleteArtifactResp, error) {
	bodyBytes, err := io.ReadAll(rsp.Body)
	defer func() { _ = rsp.Body.Close() }()
	if err != nil {
		return nil, err
	}

	response := &DeleteArtifactResp{
		Body:         bodyBytes,
		HTTPResponse: rsp,
	}

	switch {
	case strings.Contains(rsp.Header.Get("Content-Type"), "json") && rsp.StatusCode == 200:
		var dest EnvelopeDeleteData
		if err := json.Unmarshal(bodyBytes, &dest); err != nil {
			return nil, err
		}
		response.JSON200 = &dest

	case strings.Contains(rsp.Header.Get("Content-Type"), "json") && true:
		var dest HouseError
		if err := json.Unmarshal(bodyBytes, &dest); err != nil {
			return nil, err
		}
		response.JSONDefault = &dest

	}

	return response, nil
}

func ParseGetArtifactResp(rsp *http.Response) (*GetArtifactResp, error) {
	bodyBytes, err := io.ReadAll(rsp.Body)
	defer func() { _ = rsp.Body.Close() }()
	if err != nil {
		return nil, err
	}

	response := &GetArtifactResp{
		Body:         bodyBytes,
		HTTPResponse: rsp,
	}

	switch {
	case strings.Contains(rsp.Header.Get("Content-Type"), "json") && rsp.StatusCode == 200:
		var dest EnvelopeArtifactResponse
		if err := json.Unmarshal(bodyBytes, &dest); err != nil {
			return nil, err
		}
		response.JSON200 = &dest

	case strings.Contains(rsp.Header.Get("Content-Type"), "json") && true:
		var dest HouseError
		if err := json.Unmarshal(bodyBytes, &dest); err != nil {
			return nil, err
		}
		response.JSONDefault = &dest

	}

	return response, nil
}

func ParseCompleteUploadResp(rsp *http.Response) (*CompleteUploadResp, error) {
	bodyBytes, err := io.ReadAll(rsp.Body)
	defer func() { _ = rsp.Body.Close() }()
	if err != nil {
		return nil, err
	}

	response := &CompleteUploadResp{
		Body:         bodyBytes,
		HTTPResponse: rsp,
	}

	switch {
	case strings.Contains(rsp.Header.Get("Content-Type"), "json") && rsp.StatusCode == 200:
		var dest EnvelopeArtifactResponse
		if err := json.Unmarshal(bodyBytes, &dest); err != nil {
			return nil, err
		}
		response.JSON200 = &dest

	case strings.Contains(rsp.Header.Get("Content-Type"), "json") && true:
		var dest HouseError
		if err := json.Unmarshal(bodyBytes, &dest); err != nil {
			return nil, err
		}
		response.JSONDefault = &dest

	}

	return response, nil
}

func ParseDownloadArtifactResp(rsp *http.Response) (*DownloadArtifactResp, error) {
	bodyBytes, err := io.ReadAll(rsp.Body)
	defer func() { _ = rsp.Body.Close() }()
	if err != nil {
		return nil, err
	}

	response := &DownloadArtifactResp{
		Body:         bodyBytes,
		HTTPResponse: rsp,
	}

	switch {
	case strings.Contains(rsp.Header.Get("Content-Type"), "json") && rsp.StatusCode == 200:
		var dest EnvelopeDownloadResponse
		if err := json.Unmarshal(bodyBytes, &dest); err != nil {
			return nil, err
		}
		response.JSON200 = &dest

	case strings.Contains(rsp.Header.Get("Content-Type"), "json") && true:
		var dest HouseError
		if err := json.Unmarshal(bodyBytes, &dest); err != nil {
			return nil, err
		}
		response.JSONDefault = &dest

	}

	return response, nil
}
