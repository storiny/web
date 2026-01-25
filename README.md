# Storiny

> "Information should be free. It's an ethical imperative. Only information tied to a physical product should have a monetary cost attached to it." - Aaron Swartz

<br />

Storiny is where you and your ideas belong, serving a space for like-minded individuals to connect, share experiences, and valuable knowledge without the hassle of managing stuff that happens behind the scenes on the vast internet.

Unlike a personal blog, publishing on Storiny is like sharing your ideas in a giant, welcoming room filled with diverse readers, creating opportunities for learning, growth, and meaningful connections.

You own your ideas, and they are never restricted behind a paywall.

<br />

***

<img width="1636" height="858" alt="image" src="https://github.com/user-attachments/assets/304b8a26-6133-47f8-8b50-a4adad9d3289" />

***

<img width="1636" height="858" alt="image" src="https://github.com/user-attachments/assets/9e7d0807-f3f7-4e8d-a01e-8d7ee22b3ddf" />

***

<img width="1636" height="858" alt="image" src="https://github.com/user-attachments/assets/e47f162b-b9c6-4989-b01b-27c7207117f2" />

***

<img width="1636" height="858" alt="image" src="https://github.com/user-attachments/assets/e1b2dce1-4c7e-41c4-8405-f3163ba5a405" />

***

<img width="1636" height="858" alt="image" src="https://github.com/user-attachments/assets/a70deceb-f3b4-4955-9d49-22f7428cb734" />

***

<img width="1636" height="858" alt="image" src="https://github.com/user-attachments/assets/6e9f0ad3-0a7d-4456-b19b-b811db00726b" />

***

<img width="1636" height="858" alt="image" src="https://github.com/user-attachments/assets/96d40a0c-73c2-40ed-ae45-dc563eff17e9" />

***

# Services

The project began as a monolith in this repository and was later split into multiple microservices as complexity grew and isolating different tech stacks became necessary.

- [`storiny/web`](https://github.com/storiny/web) *(this repository)*: Contains the source code for the main site, blogs, the Snowflake design system, and gRPC IDL definitions.
- [`storiny/api`](https://github.com/storiny/api): Contains the source code for REST API endpoints and the real-time collaborative engine.
- [`storiny/discovery`](https://github.com/storiny/discovery): Contains the source code for the Discovery service, which is responsible for embedding and rendering third-party content in stories.
- [`storiny/og`](https://github.com/storiny/og): Contains the source code for the dynamic Open Graph image generation service used for social previews.
- [`storiny/cdn`](https://github.com/storiny/cdn): Contains the source code for the CDN service.
- [`storiny/eslint-config`](https://github.com/storiny/eslint-config): Shared ESLint configuration.
- [`storiny/prettier-config`](https://github.com/storiny/prettier-config): Shared Prettier configuration.
- [`storiny/tsconfig`](https://github.com/storiny/tsconfig): Shared TypeScript configuration.

<br />

# Design files

- Snowflake design system: https://www.figma.com/design/0cENs5ojK3gEPON9GZYN1Y/Snowflake-Design-System
- Main site: https://www.figma.com/design/GpSLRc3O19ocgtl8sOff5i/Main-Site
- Dashboard: https://www.figma.com/design/sA8vHzcxqGpFF6HmKmzZ2Z/Dashboard

<br />

# The future of Storiny

After around 4.5 years of development and maintenance, Storiny has now been sunset. Continuing active development is outside my available bandwidth and I want to focus on other projects and commitments.

All existing users have been emailed with a link to download a complete archive of their data, including profiles, images, stories, and responses.

Since the project didn't take off as intended, it has been open-sourced. I won't be accepting major PRs or new feature requests, but minor fixes are welcome. Feel free to fork it and take it wherever you want.

\- [zignis](https://github.com/zignis)

***

<img width="1200" height="630" alt="image" src="https://github.com/user-attachments/assets/dd9998c4-b545-4283-8587-939cc1819243" />
