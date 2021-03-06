import React, { useState } from 'react'
import { CredentialsConsumer, IdentityIdConsumer, IotConsumer } from '../App'
import { Alert, Card, CardBody } from 'reactstrap'
import { S3 } from 'aws-sdk'
import Athena from 'aws-sdk/clients/athena'
import { uploadAvatar } from '../uploadAvatar'
import { updateThingAttributes } from '../updateThingAttributes'
import { HistoricalDataChart } from '../../HistoricalData/HistoricalDataChart'
import { Collapsable } from '../../Collapsable/Collapsable'
import { HistoricalDataLoader } from '../../HistoricalData/HistoricalDataLoader'
import { emojify } from '../../Emojify/Emojify'
import { describeIotThing } from '../describeIotThing'
import { upgradeFirmware } from '../upgradeFirmware'
import { listUpgradeFirmwareJobs } from '../listUpgradeFirmwareJobs'
import { cancelUpgradeFirmwareJob } from '../cancelUpgradeFirmwareJob'
import { deleteUpgradeFirmwareJob } from '../deleteUpgradeFirmwareJob'
import { DeleteCat } from '../../Cat/DeleteCat'
import { deleteIotThing } from '../deleteIotThing'
import { connectAndListenForStateChange } from '../connectAndListenForStateChange'
import { getThingState } from '../getThingState'
import { updateThingConfig } from '../updateThingConfig'
import { Cat } from '../../Cat/Cat'
import { CatLoader } from './CatLoader'
import { CatMap } from './CatMap'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb-v2-node'

const athenaWorkGroup =
	process.env.REACT_APP_HISTORICALDATA_WORKGROUP_NAME || ''
const athenaDataBase = process.env.REACT_APP_HISTORICALDATA_DATABASE_NAME || ''
const athenaRawDataTable = process.env.REACT_APP_HISTORICALDATA_TABLE_NAME || ''

export const CatActions = ({ catId }: { catId: string }) => {
	const [deleted, setDeleted] = useState(false)

	if (deleted) {
		return (
			<Card>
				<CardBody>
					<Alert color={'success'}>
						The cat <code>{catId}</code> has been deleted.
					</Alert>
				</CardBody>
			</Card>
		)
	}

	return (
		<CredentialsConsumer>
			{credentials => (
				<IdentityIdConsumer>
					{identityId => (
						<IotConsumer>
							{({ iot, iotData }) => {
								const s3 = new S3({
									credentials,
									region: process.env.REACT_APP_REGION,
								})
								const athena = new Athena({
									credentials,
									region: process.env.REACT_APP_REGION,
								})
								const avatarUploader = uploadAvatar({
									s3,
									bucketName: `${process.env.REACT_APP_AVATAR_BUCKET_NAME}`,
								})
								const attributeUpdater = updateThingAttributes({
									iot,
									thingName: catId,
								})

								const createUpgradeJob = upgradeFirmware({
									s3,
									bucketName: `${process.env.REACT_APP_FOTA_BUCKET_NAME}`,
									iot,
								})

								const listUpgradeJobs = listUpgradeFirmwareJobs({
									iot,
								})

								const cancelUpgradeJob = cancelUpgradeFirmwareJob({
									iot,
								})

								const deleteUpgradeJob = deleteUpgradeFirmwareJob({
									s3,
									bucketName: `${process.env.REACT_APP_FOTA_BUCKET_NAME}`,
									iot,
								})

								const describeThing = describeIotThing({ iot })

								const deleteCat = deleteIotThing({ iot })

								return (
									<CatLoader catId={catId} describeThing={describeThing}>
										{(cat, update) => (
											<Cat
												cat={cat}
												identityId={identityId}
												credentials={credentials}
												getThingState={async () =>
													getThingState(iotData)(catId)
												}
												listenForStateChange={async onNewState =>
													connectAndListenForStateChange({
														clientId: `user-${identityId}-${Date.now()}`,
														credentials,
														deviceId: catId,
														onNewState,
													}).then(connection => () => connection.end())
												}
												updateDeviceConfig={async cfg =>
													updateThingConfig(iotData)(catId)(cfg).then(() => {
														update({
															...cat,
															version: ++cat.version,
														})
													})
												}
												listUpgradeJobs={async () => listUpgradeJobs(catId)}
												cancelUpgradeJob={async ({
													jobId,
													force,
												}: {
													jobId: string
													force: boolean
												}) =>
													cancelUpgradeJob({ deviceId: catId, jobId, force })
												}
												deleteUpgradeJob={async ({
													jobId,
													executionNumber,
												}: {
													jobId: string
													executionNumber: number
												}) =>
													deleteUpgradeJob({
														deviceId: catId,
														jobId,
														executionNumber,
													})
												}
												onCreateUpgradeJob={async args =>
													describeThing(catId).then(async ({ thingArn }) =>
														createUpgradeJob({
															...args,
															thingArn: thingArn,
														}),
													)
												}
												onAvatarChange={avatar => {
													// Display image directly
													const reader = new FileReader()
													reader.onload = (e: any) => {
														update({
															...cat,
															avatar: e.target.result,
														})
													}
													reader.readAsDataURL(avatar)

													avatarUploader(avatar)
														.then(async url =>
															attributeUpdater({ avatar: url }),
														)
														.catch(console.error)
												}}
												onNameChange={name => {
													attributeUpdater({ name }).catch(console.error)
												}}
												catMap={state => (
													<CatMap
														athena={athena}
														cat={cat}
														state={state}
														athenaDataBase={athenaDataBase}
														athenaWorkGroup={athenaWorkGroup}
														athenaRawDataTable={athenaRawDataTable}
														dynamoDBClient={
															new DynamoDBClient({
																credentials,
																region: process.env.REACT_APP_REGION,
															})
														}
														cellGeoLocationCacheTable={
															process.env
																.REACT_APP_CELL_GEO_LOCATIONS_CACHE_TABLE as string
														}
													/>
												)}
											>
												<Collapsable
													id={'cat:bat'}
													title={<h3>{emojify('🔋 Battery')}</h3>}
												>
													<HistoricalDataLoader
														athena={athena}
														deviceId={catId}
														QueryString={`SELECT min(reported.bat.v) as value, CAST(date_format(timestamp, '%Y-%m-%d') AS DATE) AS date FROM 
${athenaDataBase}.${athenaRawDataTable} WHERE deviceId='${catId}' AND reported.bat IS NOT NULL GROUP BY CAST(date_format(timestamp, '%Y-%m-%d') AS DATE) ORDER BY date LIMIT 100`}
														formatFields={{
															value: v => parseInt(v, 10) / 1000,
															date: v => new Date(`${v}T00:00:00Z`),
														}}
														workGroup={athenaWorkGroup}
													>
														{({ data }) => (
															<HistoricalDataChart data={data} type={'line'} />
														)}
													</HistoricalDataLoader>
												</Collapsable>
												<hr />
												<Collapsable
													id={'cat:act'}
													title={<h3>{emojify('🏋️ Activity')}</h3>}
												>
													<HistoricalDataLoader
														athena={athena}
														deviceId={catId}
														formatFields={{
															value: (v: number[]) =>
																v.reduce((sum, v) => sum + Math.abs(v), 0),
															date: v => new Date(v),
														}}
														QueryString={`SELECT reported.acc.ts as date, reported.acc.v as value FROM ${athenaDataBase}.${athenaRawDataTable} WHERE deviceId='${catId}' AND reported.acc IS NOT NULL ORDER BY reported.acc.ts DESC LIMIT 100`}
														workGroup={athenaWorkGroup}
													>
														{({ data }) => (
															<HistoricalDataChart
																data={data}
																type={'column'}
															/>
														)}
													</HistoricalDataLoader>
												</Collapsable>
												<hr />
												<Collapsable
													id={'cat:dangerzone'}
													title={<h3>{emojify('☠️ Danger Zone')}</h3>}
												>
													<DeleteCat
														catId={catId}
														onDelete={() => {
															deleteCat(catId)
																.then(() => {
																	setDeleted(true)
																})
																.catch(console.error)
														}}
													/>
												</Collapsable>
											</Cat>
										)}
									</CatLoader>
								)
							}}
						</IotConsumer>
					)}
				</IdentityIdConsumer>
			)}
		</CredentialsConsumer>
	)
}
