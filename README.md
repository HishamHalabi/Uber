> [!NOTE]
> **Project Attribution**: Core backend logis, system design, and geospatial indexing were developed ,ETA (map matching  , graph  ,algos ) 100% by me. I just used AI assistance for the frontend and documenting myProject

# UberOps. | Advanced Ride Orchestration Subsystem

![UberOps Hero Banner](./assets/Uber.png)

## 🚀 Overview
**UberOps** is a high-performance, real-time ride-sharing engine built from the ground up to solve complex geospatial and concurrency challenges. This isn't just a UI clone; it's a deep-dive into the engineering required to handle thousands of concurrent driver-passenger interactions with atomic integrity.

###  | [Video Walkthrough](https://youtu.be/QWqxFS5rs58)

---

## 🛠️ The Tech Stack
- **Frontend**: Vanilla JS with Glassmorphic CSS (High-Performance System Terminal UI)
- **Real-Time**: Socket.io for bi-directional telemetry stream
- **Backend**: Node.js & Express (Scalable Cluster Architecture)
- **Data & Geo**: Sequelize (RDBMS), Redis (Distributed Locking), **H3 (Uber’s Hexagonal Indexing)**
- **Security**: JWT Identity Gateway, OTP Verification, Rate Limiting (Helmet/Limiter)

---

## 🧠 The Engineering Effort
> *"Good system design is a series of trade-offs. I didn't just build an app; I wrestled with the same geospatial indexing problems Uber's engineers faced."*

### 1. Geospatial Optimization (H3 v.s. Hashing)
I spent significant effort researching and implementing **H3 (Hexagonal Hierarchical Geospatial Indexing)**. While simple grid hashing is easier, H3's uniform resolution and efficient neighbors-finding are critical for driver dispatching. 
- **The Challenge**: Optimizing 'candidate' driver selection.
- **The Solution**: Leveraging H3 to find nearby cars in O(1) time without massive DB scans.

### 2. Concurrency & Race Conditions
In a high-traffic app, "Double Booking" a driver is a failure. 
- **Implementation**: Integrated **Redis locking** to ensure that once a driver accepts a dispatch, the transaction is atomic. No two passengers can ever grab the same driver at the same millisecond.

### 3. Multi-Graph ETA Routing Engine
I abandoned basic proximity estimators to build a highly accurate, mathematical street-routing engine.
- **OSM Data Ingestion**: Built a custom node parser capable of mapping raw OpenStreetMap (`.pbf`) geography into an active in-memory multigraph.
- **Bounded Dijkstra Pathfinding**: Instead of resolving $O(V+E)$ Dijkstra calculations blindly over millions of city nodes, the subsystem dynamically bounds its routing limits to adjacent H3 hexagon shards, executing true street routing with sub-millisecond efficiency.
- **Machine Learning & Traffic Memory**: Fused Redis (to ingest real-time traffic anomalies and flux) with MongoDB (to act as the permanent historical anchor), ensuring the engine's ML models survive server cache reboots flawlessly via a smart Cache Warming strategy.

### 4. Payment Integrity & Active Telemetry
- **Atomic Transactions**: Using Sequelize transactions to ensure that a 'Trip' and 'Payment' status always sync or fail together.
- **Socket Stream Pipeline**: Coordinates dynamic real-time driver movement, pushed via Socket.io to keep the passenger's tracking UI "alive" with minimal latency.

---

## 📸 System Walkthrough
> [!TIP]
> **Watch the full  video walkthrough on YouTube: [Click Here](https://youtu.be/QWqxFS5rs58)**

#### 🔐 Identity Gateway
Secure authentication with role-based access (Passenger vs. Driver) and OTP email verification.

#### 🚖 Ride Telemetry (RADAR)
The heart of the system. Visualizes the real-time interaction between a Passenger request and Driver dispatch. Includes a "Pilot Mode" for drivers to push GPS nodes manually or via auto-telemetry.

#### 📊 Admin Explorer
A mission-control panel to monitor all active sessions, payment ledgers, and user feedbacks.

