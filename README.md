# Solver Society: Morning Routine Optimization Engine

## Overview

The **Solver Society** dashboard is a web application designed to track and optimize morning routines using Operations Research principles. It features a React-based frontend for logging daily metrics (Mood, Productivity, Duration) and a serverless AWS backend that calculates a "Solver Score" to quantify performance.

## Architecture

* **Frontend:** React (hosted on AWS S3)
* **Backend:** AWS Lambda (Python 3.9)
* **Database:** AWS DynamoDB
* **API:** AWS API Gateway (HTTP API)
* **Auth:** Simple User ID tracking

## Prerequisites

* An active AWS Account.
* Node.js and npm installed on your local machine.

---

## Part 1: Backend Deployment (AWS Console)

### Step 1: Create the Database (DynamoDB)

1. Log in to the AWS Console and navigate to **DynamoDB**.
2. Click **Create table**.
3. **Table details:**
   * **Table name:** `SolverRoutineTable`
   * **Partition key:** `userId` (String)
   * **Sort key:** `timestamp` (Number)
4. Leave default settings and click **Create table**.

### Step 2: Create IAM Role for Lambda

1. Navigate to **IAM** > **Roles** > **Create role**.
2. Select **AWS Service** and choose **Lambda**.
3. Click **Next**.
4. Search for and select `AmazonDynamoDBFullAccess` (or create a custom policy for least privilege).
5. Name the role `SolverLambdaRole` and create it.

### Step 3: Create Lambda Functions

You will create two functions using the same Python code logic.

**Function 1: `createRoutine`**

1. Navigate to **Lambda** > **Create function**.
2. **Name:** `createRoutine`.
3. **Runtime:** Python 3.9+.
4. **Execution role:** Select `Use an existing role` -> `SolverLambdaRole`.
5. Click **Create function**.
6. **Code:** Paste the content of `handler.py` (provided in project files) into the code editor.
7. **Configuration:**
   * **Runtime settings (Edit):** Set Handler to `lambda_function.create_routine`.
   * **Environment variables:** Add Key: `TABLE_NAME`, Value: `SolverRoutineTable`.
8. Click **Deploy**.

**Function 2: `getRoutines`**

1. Repeat the steps above but name the function `getRoutines`.
2. **Runtime settings (Edit):** Set Handler to `lambda_function.get_routines`.
3. Use the same Code and Environment Variables.

### Step 4: Set up API Gateway

1. Navigate to **API Gateway** > **Create API** > **HTTP API** (Build).
2. **API Name:** `SolverSocietyAPI`.
3. **Routes:**
   * `POST /routines` -> Integrate with `createRoutine` Lambda.
   * `GET /routines` -> Integrate with `getRoutines` Lambda.
4. **Stages:** Use default (`$default`) with Auto-deploy enabled.
5. **CORS Configuration (Critical):**
   * Go to **CORS** in the sidebar.
   * **Access-Control-Allow-Origin:** `*`
   * **Access-Control-Allow-Methods:** `GET`, `POST`
   * **Access-Control-Allow-Headers:** `content-type`
   * Click **Save**.
6. **Copy URL:** Note your "Invoke URL" (e.g., `https://xyz.execute-api.us-east-1.amazonaws.com`).

---

## Part 2: Frontend Deployment (React + S3)

### Step 1: Local Build

1. Initialize project:
   ```bash
   npx create-react-app solver-dashboard
   cd solver-dashboard
   npm install recharts lucide-react
   ```

2. Replace `src/App.js` with the provided `SolverApp.jsx` code.

3. Build the static files:
   ```bash
   npm run build
   ```
   *(This creates a `build` folder).*

### Step 2: Host on S3

1. Navigate to **S3** > **Create bucket**.
2. **Name:** `solver-society-dashboard-[unique-name]`.
3. **Public Access:** Uncheck "Block all public access" (acknowledge warning).
4. Create the bucket.
5. **Enable Hosting:**
   * Go to **Properties** > **Static website hosting** > Enable.
   * **Index document:** `index.html`.
   * Save.
6. **Permissions:**
   * Go to **Permissions** > **Bucket Policy**.
   * Paste the following (replace `YOUR_BUCKET_NAME`):
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Sid": "PublicReadGetObject",
               "Effect": "Allow",
               "Principal": "*",
               "Action": "s3:GetObject",
               "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
           }
       ]
   }
   ```

7. **Upload:**
   * Go to **Objects**.
   * Upload the **contents** of your local `build` folder.

---

## Part 3: Connection

1. Open your S3 Website Endpoint URL in a browser.
2. On the Login screen, enter a Username (e.g., "Agent001").
3. In the **API Endpoint** field, paste your API Gateway URL from Part 1.
4. Click **Access Dashboard**.
