# Vacation-email-auto-response-app

This will send an auto-reply to the sender of the original email, as well as a copy of the auto-reply to your own email address. Note that you should replace "bnagarudhra@gmail.com" with your own email address.

The above code is a Node.js script that demonstrates how to use the Gmail API to automatically send an out-of-office auto-reply message to incoming emails.

The code is divided into several functions, each with a specific purpose:

authorize(credentials): This function is responsible for authenticating and authorizing the application with the Gmail API using OAuth2. It reads the user's access token from a local file if it already exists, otherwise it prompts the user to generate a new one. The user is presented with a link to Google's OAuth2 consent screen, where they can grant the application access to their Gmail account.

getNewToken(oAuth2Client): This function prompts the user to enter an authorization code from the consent screen and exchanges it for an access token. The access token is then saved to a local file for future use.

createLabel(auth, labelName): This function creates a new label in the user's Gmail account with the given label name.

hasBeenRepliedTo(auth, threadId): This function checks whether an email in a given thread has already been replied to. It retrieves the message headers from the latest email in the thread and looks for an "In-Reply-To" header, which indicates that the email has already been replied to. It also extracts the sender, recipient, and subject of the email.

sendAutoReply(auth, message, labelName): This is the main function that sends the out-of-office auto-reply to incoming emails. It first checks whether the email has already been replied to using the hasBeenRepliedTo function. If not, it constructs an auto-reply message, adds the labelName label to the email, and sends the message using the Gmail API.

The script requires a credentials.json file, which contains the application's client ID and client secret. The user must also have granted the application access to their Gmail account using OAuth2. Once the script is executed, it prompts the user to enter the label name and the start and end dates of their out-of-office period.
