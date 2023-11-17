# Format

`service?:namespace:[identifier]`

# Namespaces

| Namespace | Expansion         | Format              | Description                   |
|-----------|-------------------|---------------------|-------------------------------|
| `a:l`     | `api:limit`       | `a:l:client_ip`     | Rate limit (API server)       |
| `d:l`     | `discovery:limit` | `d:l:client_ip`     | Rate limit (Discovery server) |
| `s`       | `session`         | `s:uid:session_key` | Session                       |