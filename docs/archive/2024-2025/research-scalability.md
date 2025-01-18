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

| Horizontal scalability |                                                                                                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Preliminary**        | 1. What actions are expected to be involved? <br> 2. Which providers should be tested on their Kubernetes hosting? <br> 3. What is the expected cost of load testing on each hosting provider?              |
| **Sub questions**      | 1. How to generate realistic loads for the Kubernetes instances? <br> 2. How is Spaced failing to keep up while scaling past the maxium threshold? <br> 3. How can Spaced be optimized to be more scalable? |

| Remark             | Description                                                                                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Less than 1 second | The less than a second measurement **may** be taken on a local system instead of a hosting provider to reduce costs. It does mean these measurements should not be used to talk about "real world performance". |
| Threshold          | The threshold is to be determined, but most likely involves the amount of clients connected and the traffic they are sending over a certain period of time.                                                     |

<div style="page-break-after: always;"></div>

### 2. Results

#### 2.1 Preliminary questions

#####	2.1.1. What actions are expected to be involved?

Creating a document, editing, moving, sharing and deleting.

#####	2.1.2. What is the expected cost of load testing on each hosting provider?
#####	2.1.3. Which providers should be tested on their Kubernetes hosting?

- [Amazon Web Services - EC2](https://aws.amazon.com/ec2/)
- [Google Cloud](https://cloud.google.com/learn/what-is-a-virtual-private-server?hl=en), free 300 credit 90day trail

#### 2.2 Sub questions

#####	2.2.1. How to generate realistic loads for the Kubernetes instances?
#####	2.2.2. How is Spaced failing to keep up while scaling past the maxium threshold?
#####	2.2.3. How can Spaced be optimized to be more scalable?

### 3. Conclusion
