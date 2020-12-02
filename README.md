# FLS Proficiency Test

## [Live Site](https://fls-international.web.app/)

## Overview

This is a Node app designed to be deployed to [Firebase](https://firebase.google.com/), using [Firebase Cloud Functions](https://firebase.google.com/docs/functions). It uses Express for routing. [Nodemailer](https://nodemailer.com/about/) is used to handle sending the graded test results to the test taker. I highly recommend watching [this tutorial](https://www.youtube.com/watch?v=LOeioOKUKI8) on Node apps & the Express library in Firebase to help develop your understanding of repo's architecture.

## Running Locally
* Install the Firebase CLI

```shell
npm install -g firebase-tools
```

* Log into Firebase in the command line (see credentials in [Google Doc](https://docs.google.com/document/d/10vJser2UQQnUcDWYj61Jk-a38K6K8GoTkNgWqzzBMFQ/edit))

```shell
firebase login
```

* Make sure the `firebase` command references this repo's Firebase project by running this command from within this repo (same directory as the `firebase.json` file)

```shell
# You will be prompted to select a project, and then create an alias. The alias name is not important. I suggest using something simple, like `dev`.
firebase use --add
```

* If you haven't already, ensure that all dependencies are intalled.

```shell
# Run this from within the 'functions' directory
npm install
```

* Run the local hosting & cloud function tools

```shell
# Run this from within the root directory of the repo
firebase serve --only functions,hosting
```

You can now navigate to `http://localhost:5000` to see the app in action.

* **Note:** If you want Nodemailer to work locally, you'll need to create and populate an `.env` file in the `functions` directory (see `.env.sample` for the template). Check the google doc for the Nodemailer email & password.

## Deploying to Firebase

* Deploying to Firebase is as simple as running `firebase deploy`. After deploying, you can navigate to https://fls-international.web.app to see the live app. As of this writing, this URL is the production URL, and is what is currently being distributed to prospective students.

* `.env` values are already set in production, and are necessart for Nodemailer to mail out graded proficiency test results. You can report the `.env` values that have been set in firebase by running `firebase functions:config:get` in the command line. This will output the current production `.env` values to the command line. If, for any reason, you need to change these values, see [these docs](https://firebase.google.com/docs/functions/config-env).