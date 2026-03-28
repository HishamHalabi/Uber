# UberOps. | Internal API Documentation

This document provides a technical technical specifications for the UberOps backend gateway. All requests require `accesstoken` in headers unless specified otherwise.

---

## 🔐 Identity Gateway (Auth)
Base Path: `/auth`

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/signUpUser` | `POST` | Register a new passenger. | No |
| `/signUpDriver` | `POST` | Register a new driver (requires NationalID, CarNo). | No |
| `/signIn` | `POST` | Authenticate and receive JWT + Refresh Token. | No |
| `/verifyEmail` | `PATCH` | Verify email using OTP code. | No |
| `/sendEmailVerification` | `POST` | Re-send OTP to user's email. | No |
| `/forgetPassword` | `POST` | Initiate password recovery. | No |
| `/changePassword` | `POST` | Execute password reset via OTP. | No |
| `/retakeAccessToken` | `POST` | Refresh expired session. | Refresh Token |

---

## 🚘 Ride Orchestration (Trips)
Base Path: `/trips`

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | List all historical trips (Admin). |
| `/request` | `POST` | Passenger: Initiate a new ride request. |
| `/accept` | `POST` | Driver: Accept a ride dispatch. |
| `/update-status` | `PATCH` | Sync trip state (Searching -> Active -> Finished). |
| `/cancel` | `POST` | Abort active trip (supports refund logic). |

---

## 📡 Live Telemetry (Sockets)
Real-time events pushed via Socket.io.

| Event Name | Role | Payload | Description |
| :--- | :--- | :--- | :--- |
| `rideAlert` | Driver | `{lat, lng, user_id, ETA}` | 🚨 New ride request within range. |
| `assign` | Both | `{room_id, paymentKey}` | 🔗 Trip handshake established. |
| `startRide` | Both | `Trip Object` | 🚀 Ignition: Ride has started. |
| `update-location` | Driver | `{lat, lng}` | 📡 Node sync pushed to cluster. |
| `finishTrip` | Passenger| `Trip Object` | 🎌 Trip completed successfully. |

---

## 📂 User & Feedbacks
Base Path: `/user` & `/feedbacks`

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/user/` | `PATCH` | Update profile (Name, Phone). |
| `/user/update-profilePic`| `PATCH` | Upload avatar (Multipart/form-data). |
| `/feedbacks/addFeedBack` | `PATCH` | Submit trip rating and comment. |

---

> [!NOTE]
> All timestamps are in ISO 8601. Errors return a `success: false` flag with a descriptive `Message`.
