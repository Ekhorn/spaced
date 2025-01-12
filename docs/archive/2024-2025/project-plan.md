<style>
* {
  font-size: 12px;
}
</style>

# Blazingly Fast Knowledge Base <!-- omit in toc -->

## Spaced <!-- omit in toc -->

![](../assets/spaced-2024-rich-text.png)

|         |                      |
| ------- | -------------------- |
| Date    | 2024-10-08           |
| Version | 1.0                  |
| State   | final draft          |
| Author  | Koen Schellingerhout |
|         |                      |

<div style="page-break-after: always;"></div>

#### Version history <!-- omit in toc -->

| Version | Date       | Author               | Changes                                                             | State       |
| ------- | ---------- | -------------------- | ------------------------------------------------------------------- | ----------- |
| 0.1     | 2024-09-26 | Koen Schellingerhout | initial version                                                     | draft       |
| 1.0     | 2024-10-08 | Koen Schellingerhout | remove testing strategy, add sub questions, and various other fixes | final draft |

#### Distribution <!-- omit in toc -->

| Version | Date       | Receivers                                                 |
| ------- | ---------- | --------------------------------------------------------- |
| 0.1     | 2024-10-08 | Canvas                                                    |
| 1.0     | 2024-10-08 | Bram Tuns, Rens van der Vorst, Marc Jonkers, Erik Schriek |

<div style="page-break-after: always;"></div>

### Contents <!-- omit in toc -->

<style>
  .toc > ul { padding-left: 1em; }
  .toc > * * ul { padding-left: 1em; }
  .toc > * > li { list-style-type: none; }
  .toc > * * > li { list-style-type: none; }
</style>

<div class="toc">

- [1. Project assignment](#1-project-assignment)
  - [1.1. Context](#11-context)
  - [1.2. Goals](#12-goals)
  - [1.3. Scope and preconditions](#13-scope-and-preconditions)
  - [1.4. Strategy](#14-strategy)
  - [1.5. Research questions](#15-research-questions)
  - [1.6. End Products](#16-end-products)
- [2. Planning](#2-planning)
- [3. Risks](#3-risks)

</div>

<div style="page-break-after: always;"></div>

### 1. Project assignment
#### 1.1. Context

**Backstory**

In semester 4 I initiated my personal open source project "Spaced" (back then Info-map/Limitless notes). The project is a knowledge base application for students, experts and life long learners to store their learning's throughout life. You may ask how does this differ with note taking apps? A knowlegde base is very much like a second brain, you **aggregate** and **curate** your notes, **connect** them to create **contexts**, and use those for futures **references points**<sup id="1">[1]</sup>. It doesn't mean ordinary note taking apps can't be knowledge bases, however they may contain less features than one may want.

**Why build Spaced?**

The reason I want to build a knowledge base application is first and fore most for myself; to fit my needs as best as possible. Secondly it's a project I can iterate on for years to come, and learn a lot from; including AI, 3D modelling/rendering, text editing, and more. Lastly I think I can make something unique with features people haven't integrated fully into one. _Similar applications are: [Miro](miro.com), [Milanote](milanote.com), Obsidian.md, [Notion](notion.so), [Logseq](logseq.com) etc._

**Principles**

I want Spaced to be as fun as possible. To do so an important requirement to make something fun, especially when working with anything graphical is it needing to be fast, one might say blazingly fast. Another is simplicity and ease of use. I aim to provide as many features as possible with the least amount of complexity adhering to [KISS](https://www.interaction-design.org/literature/topics/keep-it-simple-stupid) (Keep It Simple Stupid!). Google Docs is actually what inspires a lot of my ideas and decisions about Spaced, because the web app works incredibility well and feels a lot simpler compared to Word.

Additionally lots of applications are proprietary. It's more common for software libraries to be open-source whereas end user applications, especially popular ones are almost never fully open-source. So Spaced being open-source is one of it's selling points. I'm aiming to document how Spaced works and how it's developed for transparency.

Lastly, privacy and security are important as well, specifically adhering to the GDPR, and going over common security vulnerabilities for people to be confident in Spaced.

**State of Spaced**

Spaced is currently a blank page with dots in a grid, a button to create a text note, a button to select whether you want your data to be stored in the browser or when you've installed the desktop app, the ability to store them to the local file system. You can also drag or copy images, text files, markdown and PDF files into Spaced to be rendered. Only the web app-, and local file system storage are currently working. The server backend is outdated and doesn't work any longer.

<div style="page-break-after: always;"></div>

| Technologies             | Use case                  | Description                                                                     |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------- |
| Typescript, Rust         | Programming               | Typescript on the front-end, Rust on the backend                                |
| SolidJS, SocketIO.client | Web app frameworks        | SolidJs for reactivity, SocketIO.client for WebSocket communication             |
| Axum, Socketioxide       | Server backend frameworks | Axum for general HTTP servers, Socketioxide for backend WebSocket communication |
| Tauri                    | Desktop backend           | Tauri as general platform native backend to render web frontends                |
| Docker                   | Containerization          | Docker to containerize HTTP services using Distroless base images               |
| RabbitMQ                 | Messaging                 | Used to message between multiple websocket servers over AMQP channels           |
| Nginx                    | Reverse-proxy             | Routes incoming traffic to backend services, and vice-versa                     |
| Kubernetes               | Cluster management        | To manage and create a scalable and fault tolerant system                       |

<br>

| Infrastructure | Use case                    | Description                                                                                                                                                                                                                             |
| -------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub Actions | CI/CD pipeline              | [Runs linting/formatting, type checking, unit/integration tests, unused depedency, docker build, and End-to-End testing jobs](https://github.com/Ekhorn/spaced/blob/3e93dfc3a0dfd4ba3cd576807211c2ccdea0f75f/.github/workflows/ci.yaml) |
| Renovate Bot   | Depedency management        | [Check for Rust, JavaScript, Docker, and GitHub Action depedency version updates](https://github.com/Ekhorn/spaced/blob/3e93dfc3a0dfd4ba3cd576807211c2ccdea0f75f/.github/renovate.json)                                                 |
| GitHub Pages   | Hosting Demos/Documentation | Manually configured to render a [demo of Spaced](https://ekhorn.github.io/spaced/demo/), including a brief [introduction page](https://ekhorn.github.io/spaced/).                                                                       |

<div style="page-break-after: always;"></div>

#### 1.2. Goals

The overarching goal of Spaced is to be a highly customizable, performant, open-source, knowledge base application, with ease of use, transparency, security and privacy in mind.

The **goals** for this assignment are **focused** on implementing **editing-**, **creating-** and **exporting documents** in **collaboration** as best as possible. This should keep the assignment **vertically integrated**.

1. **What**: Build the UI needed to edit, create, export documents in collaboration.
  <br>**Why**: These are essential to sharing and maintaining knowledge.
	<br>**How**: Using [Slate.js](https://www.slatejs.org/examples/richtext) one can create a rich text editor, similar to what you might expect from Google Docs including [collaboration support](https://docs.slatejs.org/walkthroughs/07-enabling-collaborative-editing). Slate.js is relatively simple, and very extendable to allow documenting to be quick and fun, which will allow Spaced to come up with new and exciting ways to edit documents.
1. **What**: Finish the back-end services required to collaborate on these documents.
	<br>**Why**: So data can be shared between multiple users in real-time.
	<br>**How**: Unifying the document data into one schema that can easily be processed on the server. Then making the servers save and broadcast this data to the right end user.
2. **What**: Deploy the application to mulitple VPS (virtual private server) hosting providers, test and optimize vertical scalability of the system.
	<br>**Why**: To explore which are the cheapest VPS hosting providers, and ensure Spaced is cheap to host.
	<br>**How**: Load test Spaced using tools like Artillery.io to gather insights on bottlenecks in the system. Then find faster alternative solutions, or algorithms to be benchmarked.
3. **What**: Deploy the application on different hosting providers that support managed Kubernetes cluster, and test the horizontal scalability.
	<br>**Why**: So larger businesses can be confident in Spaced to scale without faults.
	<br>**How**: By adding monitoring solutions that aggregate incoming traffic to Spaced, and load-testing once again using Artillery.
4. **What**: Automatically create and publish new releases from the pipeline, and deploy. Additionally add job monitoring.
	<br>**Why**: To apply continous delivery automatically from the pipeline. Additionally job monitoring can create an overview of bottlenecks to be fixed; that allows for quick iteration.
  <br>**How**: Changing the build job for _Docker containers_\*, tp publish them to the GitHub container registry, including creating GitHub releases the Desktop binaries. To mintor job execution time, data may be aggregated using the GitHub API and exported into a CSV file.
1. **What**: Document how Spaced is built, including performance metrics, cost analysis, security- and privacy audits and dependency license checking.
	<br>**Why**: Transparency is a major factor for Spaced, as you want to be confident when using Spaced; that your data is secure and private at the lowest possible cost without facing legal issues.
	<br>**How**: In the Spaced repository as Markdown, which automatically deploy to GitHub pages for users to read. Performance metrics, and hosting costs will be documented as result of benchmarks, and load tests performed during goals 3 and 4. A privacy audit will be done based on the [GDPR checklist](https://gdpr.eu/checklist/), as well as a security audit based on the [OWASP top 10](https://owasp.org/Top10/). Licenses can be checked using [fossa.com](https://fossa.com/).

**Remark**<br>Docker containers are currently used to create a sandboxed, and reliable method of sharing backend services. In the future Spaced might look into switching over to [WASI](https://wasi.dev/) (WebAssembly System Interface) to remove any overhead containers may add.

<div style="page-break-after: always;"></div>

#### 1.3. Scope and preconditions

| Inside scope:                                                          | Outside scope:                                                                                       |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1 Editing, creating, and exporting documents in collaboration.         | 1 Creating tables inside a document, and other more exotic features.                                 |
| 2 Updating the CI/CD pipeline to be abe to release and deploy version. | 2 Trying out WASI (WebAssembly System Interface) as alternative to Docker containers.                |
| 3 Privacy audit based on the GDPR checklist                            | 3 Auditing for any other privacy regulations other than the GDPR, and applying full GDPR compliance. |
| 4 Security audit based on the OWASP top 10                             | 4 Fixing these vulnerabilities                                                                       |


<div style="page-break-after: always;"></div>

#### 1.4. Strategy

The strategy used is about being Agile. Iterate quickly, and always making sure something tangible exists to be improved, rather than making the project more broad. If something is holding you back remove it.

The strategy employed for Spaced is always simplicity/intuitiveness over feature completeness. However the goal is to increase is feature completeness, and to maintain or improve feature quality. Both perfecting if nothing tangible exists (something the user can interact with), and immediately moving on to something new broadening project scope are discouraged. However experimenting with new ideas is encouraged, but know when to let it go if not of value.

To adhere to this the following definition of done will be used:
1. The pipeline passes: including lint jobs, unit/integration tests, End-to-End tests, builds and deployments.
2. The performance characteristics haven't decreased past a 99% reliable latency of _less than 1_* second, maintained until the previous measured _threshold_* is reached.

| Remark             | Description                                                                                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Less than 1 second | The less than a second measurement **may** be taken on a local system instead of a hosting provider to reduce costs. It does mean these measurements should not be used to talk about "real world performance". |
| Threshold          | The threshold is to be determined, but most likely involves the amount of clients connected and the traffic they are sending over a certain period of time.                                                     |

<div style="page-break-after: always;"></div>

#### 1.5. Research questions

**Primary question**
How to make creating and collaborating on documents in Spaced for students and experts as cheap as possible while maintaining a 99% reliable latency of less than 1 seconds?

_\*Please read the remarks on the "less than 1 second" and "threshold" in [1.4. Strategy](#14-strategy)._

| Vertical scalability |                                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Preliminary**      | 1. What actions are expected to be involved? <br> 2. Which providers should be tested on their VPS hosting? <br> 3. What is the expected cost of load testing on each hosting provider?             |
| **Sub questions**    | 1. How to generate realistic loads for the VPS instances? <br> 2. How are the bottlenecks holding back the maxium threshold? <br> 3. How can Spaced be optimized to increase the maximum threshold? |

<br>

| Horizontal scalability |                                                                                                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Preliminary**        | 1. What actions are expected to be involved? <br> 2. Which providers should be tested on their Kubernetes hosting? <br> 3. What is the expected cost of load testing on each hosting provider?              |
| **Sub questions**      | 1. How to generate realistic loads for the Kubernetes instances? <br> 2. How is Spaced failing to keep up while scaling past the maxium threshold? <br> 3. How can Spaced be optimized to be more scalable? |

<div style="page-break-after: always;"></div>

#### 1.6. End Products

![](../assets/products.svg)

<div style="page-break-after: always;"></div>

### 2. Planning

The up-to-date project planning can be found at https://github.com/users/Ekhorn/projects/6/views/1. To see all sprints click on "Show empty values".

| Sprints | Start      | End         | End products                                                                                                                                                                                                                                                                         |
| ------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1       | 2024-09-20 | 2024-10-10  | (_initial_) **Code changes**: Document editing, including front-end and back-end implementation i.e. Goals: 1 & 2                                                                                                                                                                    |
| 2       | 2024-10-11 | 2024-11-07  | _Initial research of vertical scalability_, including automatic releases, and job monitoring.                                                                                                                                                                                        |
| 3       | 2024-11-08 | 2024-11-28  | **Research vertical scalability**: Deploy to choosen VPS providers, then load test and profile services, determine bottlenecks, find optimizations and/or redesigning the system, repeat. **Compare providers**: Sum up costs of hosting Spaced on each provider at different loads. |
| 4       | 2024-11-29 | 2024-12-19  | **Research horizontal scalability**: Apply a similar process to the vertical scalability tests, but include a dedicated monitoring setup for each pod in the Kubernetes clusters.                                                                                                    |
| 5       | 2024-12-20 | 2025-01-23? | Wrapup with the **Privacy-** and **Security audit** and deploy all findings to GitHub pages.                                                                                                                                                                                         |


<div style="page-break-after: always;"></div>

### 3. Risks

| Risk                                                                                     | Probability | Impact | Countermeasures                                                                                                                                                         |
| ---------------------------------------------------------------------------------------- | ----------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unable to perform proper vertical / horizontal scalability tests, because of high costs. | Medium-High | High   | 1. Testing only on free tiers<br>2. Using student plans.<br>3. Limit spending to a certain amount if possible.<br>4. Assigning the lowest amount of resources possible. |
| Due to sickness or unexpected events being unable to finish every goal                   | Medium      | Medium | 1. Scrapping the security audit goal first, then privacy audit, and the job monitoring.<br>2. Discussing alternative plans.                                             |
| Scope creep (increasing project scope)                                                   | Medium      | High   | 1. Focusing only on document editing.<br>2. Scoping<br>3. Avoid endlessly trying                                                                                        |
|                                                                                          |             |        |                                                                                                                                                                         |

[1]: https://www.taskade.com/blog/best-knowledge-base-apps/#wait-why-would-i-need-a-second-brain
