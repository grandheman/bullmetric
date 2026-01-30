# BullMetric Deployment Guide

This guide describes how to deploy the BullMetric application to your own Firebase account.

## Prerequisites

1.  **Node.js**: You must have Node.js installed on your computer. Download it from [nodejs.org](https://nodejs.org/).
2.  **Git**: (Optional) If you want to manage the code versioning.

## Quick Start (Windows)

We have provided an automated script to make deployment easy.

1.  **Create a Firebase Project**:
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click **"Add project"**.
    *   Name your project (e.g., `bullmetric-myname`).
    *   Disable Google Analytics (optional, makes setup faster).
    *   Click **"Create project"**.
    *   **Wait** for it to complete, then click **"Continue"**.

2.  **Enable Services** (Important!):
    *   **Authentication**:
        *   In the sidebar, click **Build** -> **Authentication**.
        *   Click **Get started**.
        *   Select **Native Providers** -> **Email/Password**.
        *   Enable the **Email/Password** switch.
        *   Click **Save**.
    *   **Firestore Database**:
        *   In the sidebar, click **Build** -> **Firestore Database**.
        *   Click **Create database**.
        *   Choose a location (e.g., `nam5 (us-central)`).
        *   Click **Next**.
        *   Select **Start in production mode**.
        *   Click **Create**.

3.  **Run the Script**:
    *   In the project folder, locate the file named `setup_and_deploy.bat`.
    *   **Double-click** it.
    *   It will ask you to log in to Google/Firebase.
    *   It will ask for your **Project ID**. You can find this in the Firebase Console under Project Settings (gear icon) -> General -> **Project ID** (e.g., `bullmetric-12345`).
    *   The script will install dependencies, build the app, and deploy it to the web.

## Manual Deployment (Mac/Linux/Windows)

If you cannot use the script, follow these steps in your terminal:

1.  **Install Firebase CLI**:
    ```bash
    npm install -g firebase-tools
    ```

2.  **Login to Firebase**:
    ```bash
    firebase login
    ```

3.  **Install Project Dependencies**:
    ```bash
    npm install
    ```

4.  **Connect to Your Project**:
    Replace `your-project-id` with your actual Firebase Project ID.
    ```bash
    firebase use --add your-project-id --alias default
    ```

5.  **Build the Application**:
    ```bash
    npm run build
    ```

6.  **Deploy**:
    ```bash
    firebase deploy
    ```

## Troubleshooting

*   **"Project not found"**: Double-check your Project ID. It creates a unique ID (often with numbers at the end), not just the display name.
*   **"Missing permissions"**: Ensure you are logged in with the same email account that created the Firebase project.
*   **Database Errors**: If the app loads but data doesn't save, ensure you created the **Firestore Database** in Step 2.
