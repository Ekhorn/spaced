<style>
* {
  font-size: 12px;
}
</style>

# Spaced <!-- omit in toc -->

## Blazingly Fast Knowledge Base <!-- omit in toc -->

![](../assets/spaced-2024-rich-text.png)

|         |                      |
| ------- | -------------------- |
| Date    | 2024-11-15           |
| Version | 0.1                  |
| State   | initial draft        |
| Author  | Koen Schellingerhout |
|         |                      |

<div style="page-break-after: always;"></div>

#### Version history <!-- omit in toc -->

| Version | Date       | Author               | Changes         | State |
| ------- | ---------- | -------------------- | --------------- | ----- |
| 0.1     | 2024-11-15 | Koen Schellingerhout | initial version | draft |


#### Distribution <!-- omit in toc -->

| Version | Date       | Receivers            |
| ------- | ---------- | -------------------- |
| 0.1     | 2024-11-15 | Canvas: Erik Schriek |


<div style="page-break-after: always;"></div>

###

#### 1. Research questions

**Primary question**
How to make creating and collaborating on documents in Spaced for students and experts as cheap as possible while maintaining a 99% reliable latency of less than 1 seconds?

_\*Please read the remarks below on the "less than 1 second" and "threshold"._

| Vertical scalability |                                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Preliminary**      | 1. What actions are expected to be involved? <br> 2. Which providers should be tested on their VPS hosting? <br> 3. What is the expected cost of load testing on each hosting provider?             |
| **Sub questions**    | 1. How to generate realistic loads for the VPS instances? <br> 2. How are the bottlenecks holding back the maxium threshold? <br> 3. How can Spaced be optimized to increase the maximum threshold? |

| Remark             | Description                                                                                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Less than 1 second | The less than a second measurement **may** be taken on a local system instead of a hosting provider to reduce costs. It does mean these measurements should not be used to talk about "real world performance". |
| Threshold          | The threshold is to be determined, but most likely involves the amount of clients connected and the traffic they are sending over a certain period of time.                                                     |

<div style="page-break-after: always;"></div>

### 2. Results

#### 2.1 Preliminary questions

##### 2.1.1. What actions are expected to be involved?

Creating a document, editing, moving, sharing and deleting.

##### 2.1.2. Which providers should be tested on their VPS hosting?

- [Amazon Web Services - EC2](https://aws.amazon.com/ec2/)
- [Google Cloud](https://cloud.google.com/learn/what-is-a-virtual-private-server?hl=en), free 300 credit 90day trail
- [IONOS](https://www.ionos.com/servers/vps)
- [Fontys Netlab](https://fhict.topdesk.net)

##### 2.1.3. What is the expected cost of load testing on each hosting provider?

#### 2.2 Sub questions

##### 2.2.1. How to generate realistic loads for the VPS instances?

Consider [Artillery + Playwright](https://www.artillery.io/docs/reference/engines/playwright#why-load-test-with-headless-browsers) tests to determine realistic loads by calling APIs directly from the frontend. Other more difficult methods are using HAR files mimicking realistic traffic.

Since document edits use CRDTS (Conflict-free replicated data types) combined with SocketIO that share binary data, using Playwright would be simpler compared to writing out specific requests manually.


---

understanding Artillery metrics

FCP = [First Contentful Paint](https://web.dev/articles/fcp)
TTFB = [Time To First Byte](https://web.dev/articles/ttfb)
LCP = [Largest Contentful Paint](https://web.dev/articles/lcp)
FID = [First Input Delay](https://web.dev/articles/fid)


Web Vitals

LCP (Largest Contentful Paint)
CLS (Cumulative Layout Shift)
INP (Interaction to Next Paint)
TTFB (Time To First Byte)
FCP (First Contentful Paint)
FID (First Input Delay)

---

tests

1. max single document connections
2. max document count
3. ...

phases

1. initial
2. 10min sustained expect load
3. stress test

steps

1. open page
2.


##### 2.2.2. How are the bottlenecks holding back the maxium threshold?

How does a node implementation compare to the rust implementation?

How do the different VPS instances hold up?

1vCPU 1Gb RAM

vs

2vCPU 2Gb RAM

How do different parts of the system add latencies?

How does memory increase with and without metrics?

How do default image install compare in resource usage, to nixos installs?

##### 2.2.3. How can Spaced be optimized to increase the maximum threshold?

The rust implementation as seen already improves performance significantly compared to Node as no garbage collection is involved.

Document garbage collection.

  // TODO: consider diff string for perf
  // TODO: compare HashMap to DashMap

MSGPack vs normal binary? vs Json


Limiting clients to debounce requests.


- Dive into websocket upgrades?
- Memory vs CPU bottleneck handling


### 3. Conclusion
