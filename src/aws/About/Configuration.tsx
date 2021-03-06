import React from 'react'
import { Card, CardBody, CardHeader } from 'reactstrap'
import { IdentityIdConsumer } from '../App'

export const Configuration = () => (
	<Card data-intro="This card lists the apps configuration.">
		<CardHeader>Environment</CardHeader>
		<CardBody>
			<dl>
				<dt>User</dt>
				<dd>
					<IdentityIdConsumer>
						{identityId => <code>{identityId}</code>}
					</IdentityIdConsumer>
				</dd>
				<dt>User Pool</dt>
				<dd>
					<a
						href={`https://${process.env.REACT_APP_REGION}.console.aws.amazon.com/cognito/users/?region=${process.env.REACT_APP_REGION}#/pool/${process.env.REACT_APP_USER_POOL_ID}`}
					>
						<code>{process.env.REACT_APP_USER_POOL_ID}</code>
					</a>{' '}
				</dd>
				<dt>User Pool Client ID</dt>
				<dd>
					<code>{process.env.REACT_APP_USER_POOL_CLIENT_ID}</code>
				</dd>
				<dt>MQTT Endpoint</dt>
				<dd>
					<code>{process.env.REACT_APP_MQTT_ENDPOINT}</code>
				</dd>
				<dt>Historical Data Storage</dt>
				<dd>
					<a
						href={`https://s3.console.aws.amazon.com/s3/buckets/${process.env.REACT_APP_HISTORICAL_DATA_BUCKET_NAME}/?region=${process.env.REACT_APP_REGION}&tab=overview`}
					>
						<code>{process.env.REACT_APP_HISTORICAL_DATA_BUCKET_NAME}</code>
					</a>
				</dd>
				<dt>Athena Work Group</dt>
				<dd>
					<code>{process.env.REACT_APP_HISTORICALDATA_WORKGROUP_NAME}</code>
				</dd>
				<dt>Athena Database</dt>
				<dd>
					<code>{process.env.REACT_APP_HISTORICALDATA_DATABASE_NAME}</code>
				</dd>
				<dt>Athena Table</dt>
				<dd>
					<code>{process.env.REACT_APP_HISTORICALDATA_TABLE_NAME}</code>
				</dd>
				<dt>Avatar Storage</dt>
				<dd>
					<a
						href={`https://s3.console.aws.amazon.com/s3/buckets/${process.env.REACT_APP_AVATAR_BUCKET_NAME}/?region=${process.env.REACT_APP_REGION}&tab=overview`}
						target="_blank"
						rel="noopener noreferrer"
					>
						<code>{process.env.REACT_APP_AVATAR_BUCKET_NAME}</code>
					</a>
				</dd>
				<dt>FOTA Storage</dt>
				<dd>
					<a
						href={`https://s3.console.aws.amazon.com/s3/buckets/${process.env.REACT_APP_FOTA_BUCKET_NAME}/?region=${process.env.REACT_APP_REGION}&tab=overview`}
						target="_blank"
						rel="noopener noreferrer"
					>
						<code>{process.env.REACT_APP_FOTA_BUCKET_NAME}</code>
					</a>
				</dd>
				<dt>Cell Geolocation</dt>
				<dd>
					<a
						href={`https://${process.env.REACT_APP_REGION}.console.aws.amazon.com/dynamodb/home?region=${process.env.REACT_APP_REGION}#tables:selected=${process.env.REACT_APP_CELL_GEO_LOCATIONS_CACHE_TABLE};tab=overview`}
						target="_blank"
						rel="noopener noreferrer"
					>
						<code>
							{process.env.REACT_APP_CELL_GEO_LOCATIONS_CACHE_TABLE}/
							{
								process.env
									.REACT_APP_CELL_GEO_LOCATIONS_CACHE_TABLE_CELL_ID_INDEX
							}
						</code>
					</a>
				</dd>
			</dl>
		</CardBody>
	</Card>
)
