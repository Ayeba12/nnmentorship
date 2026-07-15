---
name: system-design
description: Guidelines, architectures, and design patterns for building scalable, high-performance, and highly available large-scale backend systems. Use this skill whenever the user asks about database scaling, caching strategies, message queues, asynchronous processing, load balancing, API response optimization, system design interview prep, or microservice architecture.
---

# System Design & Architecture Skill

This skill provides a technical handbook and guidelines on how to design large-scale, highly available, and performant backend systems. Everything in system design is a series of trade-offs.

---

## 1. Core Principles & Trade-Offs

### Performance vs. Scalability
- **Performance Problem**: The system is slow for a single user (e.g., slow SQL query, unindexed search).
- **Scalability Problem**: The system is fast for a single user but grinds to a halt under heavy concurrent load (e.g., locking tables, connection pool exhaustion, lack of stateless web servers).

### Latency vs. Throughput
- **Latency**: Time taken to perform a single unit of work (aim to minimize latency).
- **Throughput**: Number of actions or results completed per unit of time (aim to maximize throughput).
- *Rule*: Optimize for acceptable latency while maximizing system throughput.

### Availability vs. Consistency (CAP Theorem)
- In a distributed system, network partitions will occur. Under a partition, you must trade off Consistency or Availability:
  - **Consistency (CP)**: Reads return the latest write or an error. Good for transactions and atomic writes.
  - **Availability (AP)**: Reads return the most available version of data (which might be stale). Good for highly responsive systems that accept eventual consistency.

---

## 2. Component Architecture Reference

### Domain Name System (DNS)
- Translates domain names to IP addresses.
- Use advanced routing where necessary:
  - **Weighted Round Robin**: Prevents traffic from overloading smaller server clusters or servers undergoing maintenance.
  - **Latency/Geolocation Routing**: Directs users to the closest available data center.

### Content Delivery Networks (CDNs)
- Globally distributed proxy networks caching static assets (HTML, CSS, JS, images, videos).
  - **Push CDN**: Server pushes updates directly to the CDN. Good for small traffic or infrequently updated content. Saves storage.
  - **Pull CDN**: CDN fetches content on the first cache miss. Good for heavy traffic. Needs Time-to-Live (TTL) tuning to avoid stale data.

### Load Balancers (LBs)
- Distribute incoming traffic to backend pools to eliminate single points of failure and overload.
  - **Layer 4 (L4) Load Balancing**: Routes traffic based on IP addresses and ports. Fast, low overhead.
  - **Layer 7 (L7) Load Balancing**: Terminates SSL and routes traffic based on HTTP headers, URLs, cookies, or content. Enables smart routing (e.g. routing image requests to image servers).

### Reverse Proxy (Web Server)
- Decouples client requests from application servers. Provides SSL termination, compression, request filtering, and rate limiting (e.g. Nginx, HAProxy).

### Database Scaling Strategies
1. **Master-Slave Replication**: Master handles writes and replicates to read-only slaves. Increases read throughput.
2. **Master-Master Replication**: Dual write heads. Risky due to replication conflicts and consistency issues.
3. **Federation (Functional Partitioning)**: Splitting databases by domain (e.g., one database for users, another for posts).
4. **Sharding**: Splitting data horizontally across databases based on a shard key (e.g. User ID). Complex but infinitely scalable.
5. **Denormalization**: Writing redundant data to tables to avoid expensive SQL JOINs under heavy read load.

### Caching Strategies
- Cache levels: Client (browser), CDN, Reverse Proxy, Application Cache (e.g., Redis, Memcached).
- **Cache Update Strategies**:
  - **Cache-Aside (Lazy Loading)**: Application queries cache first. If a miss, queries database, updates cache, and returns. Simple and resilient.
  - **Write-Through**: Write to cache and database simultaneously. Ensures no stale data, but higher write latency.
  - **Write-Back (Write-Behind)**: Write to cache first, write to database asynchronously in batches. Extremely fast writes, but risk of data loss on crash.
- **Cache Eviction**: Use Least Recently Used (LRU) or Least Frequently Used (LFU) policies.

### Asynchronism & Message Queues
- Decouple slow or heavy operations from the HTTP request-response cycle using queues (e.g., RabbitMQ, Apache Kafka).
- Use case: Sending verification emails, generating PDFs, dispatching push notifications. Return `202 Accepted` immediately, and let worker instances process the queue.
- **Backpressure**: Limit the consumption rate of worker instances to avoid resource starvation.

---

## 3. Application to the Mentorship Platform

When architecting or refactoring features for the Nigerian Navy Mentorship Platform, apply the following system design strategies:

### Decoupled Asynchronous Notifications
- **Issue**: Awaiting third-party SMTP API calls (e.g. sending a registration or session booking email) inside the API route handler blocks the thread and slows response times.
- **Solution**: 
  - Push email/notification tasks into an asynchronous queue or background worker (e.g. Celery, Redis queue, or cron-triggered queue).
  - Respond to the client instantly.

### Database Indexing Strategy
- **Issue**: Profile search, relationship lists, and logs query tables using unindexed fields, slowing down reads.
- **Solution**: Ensure secondary indexes are created for columns frequently used in `WHERE`, `JOIN`, or `ORDER BY` operations:
  - `profiles(email)`
  - `profiles(auth_id)`
  - `mentorship_relationships(mentee_id, status)`
  - `sessions(pair_id, scheduled_at)`

### Cache-Aside for Mentors Directory
- **Issue**: Listing all approved mentors hits the primary database on every user search, creating redundant database load.
- **Solution**: Implement a cache-aside pattern. Cache the list of approved mentors in Redis with a reasonable TTL (e.g. 5-10 minutes). Evict or invalidate the cache entry whenever an administrator approves or rejects a mentor account.
