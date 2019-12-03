import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { boot as bootAWS } from './aws/App'
import { boot as bootGCP } from './gcp/App'
import { boot as bootAzure } from './azure/App'

const cloudFlavour = process.env.REACT_APP_CLOUD_FLAVOUR

let App
switch (cloudFlavour) {
	case 'GCP':
		console.log(`Launching Google Cloud Platform app ...`)
		App = bootGCP({
			apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
			authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
		})
		break
	case 'AZURE':
		console.log(`Launching Microsoft Azure app ...`)
		App = bootAzure({
			clientId: process.env.REACT_APP_AZURE_CLIENT_ID || '',
			redirectUri: process.env.REACT_APP_AZURE_REDIRECT_URI || '',
		})
		break
	default:
		console.log(`Launching Amazon Webservices app ...`)
		App = bootAWS({
			identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID || '',
			region: process.env.REACT_APP_REGION || '',
			userPoolId: process.env.REACT_APP_USER_POOL_ID || '',
			userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || '',
		})
}

ReactDOM.render(<App />, document.getElementById('root'))
