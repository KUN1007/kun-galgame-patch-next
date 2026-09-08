// Package face names the public developer-platform prefix.
//
// It is a package of its own so the router, the CORS policy and the error
// handler can all agree on one string. They must: the prefix decides which CORS
// policy applies and which error dialect a failure is written in, and a second
// copy that drifts would answer an unrouted /v2/moyu path in the site's house
// envelope -- exactly the second error language this face exists to avoid.
package face

import "strings"

// Prefix is the public path (NextMoe doc 08 §16.5, face name `moyu`). Traefik
// forwards without rewriting, so the routes carry it verbatim.
//
// §16.2 first charted the downstream faces onto `/v1/<site>/*`, written while
// /v1 was the live public namespace; wave R3 retired /v1 wholesale on
// 2026-08-27 and infra re-ruled the faces onto /v2, where every live namespace
// already sits.
const Prefix = "/v2/moyu"

func IsPath(path string) bool { return strings.HasPrefix(path, Prefix) }
