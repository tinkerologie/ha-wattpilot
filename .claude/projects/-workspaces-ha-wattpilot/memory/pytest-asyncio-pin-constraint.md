---
name: pytest-asyncio-pin-constraint
description: pytest-asyncio follows the official pytest-homeassistant pin
metadata:
  type: project
---

`pytest-homeassistant` pins `pytest-asyncio` exactly. Check the current pin in
`uv.lock` and update the runner with the matching Home Assistant and plugin
releases. Dependabot groups the Home Assistant pair and skips standalone
`pytest-asyncio` updates. See [[dev-verification-setup]].
