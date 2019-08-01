import React, { useEffect, useState } from 'react'
import { IdentityIdContext, IotContext, CredentialsContext } from '../App'
import { Card, CardHeader, CardBody } from 'reactstrap'
import { Iot, IotData, S3 } from 'aws-sdk'
import { Loading } from '../Loading/Loading'
import { Error } from '../Error/Error'
import { device } from 'aws-iot-device-sdk'
import { RelativeTime } from '../RelativeTime/RelativeTime'
import { Map } from '../Map/Map'
import {
	SignalCellularConnectedNoInternet0Bar as NoSignalIcon,
	AccessTimeRounded as TimeIcon,
	DirectionsRun as SpeedIcon,
	Flight as AltitudeIcon,
	BatteryStdRounded as BatteryIcon,
	CloudDone as CloudIcon,
} from '@material-ui/icons'

import { AvatarPicker } from '../Avatar/AvatarPicker'
import { uploadAvatar } from './uploadAvatar'
import { Editable } from '../Editable/Editable'
import { updateThingAttributes } from './updateThingAttributes'
import { AccelerometerDiagram } from '../AccelerometerDiagram/AccelerometerDiagram'
import { mergeReportedAndMetadata } from '../mergeReportedAndMetadata'
import * as introJs from 'intro.js'

import './Cat.scss'

const intro = introJs()

const ReportedTime = ({
	reportedAt,
	receivedAt,
}: {
	reportedAt: string
	receivedAt: Date
}) => {
	try {
		const r = new Date(reportedAt)
		return (
			<>
				<TimeIcon /> <RelativeTime ts={r} key={r.toISOString()} />
				{(receivedAt.getTime() - new Date(reportedAt).getTime()) / 1000 >
					300 && (
					<>
						{' '}
						<CloudIcon />{' '}
						<RelativeTime ts={receivedAt} key={receivedAt.toISOString()} />
					</>
				)}
			</>
		)
	} catch {
		return (
			<>
				<CloudIcon />{' '}
				<RelativeTime ts={receivedAt} key={receivedAt.toISOString()} />
			</>
		)
	}
}

const ShowCat = ({
	catId,
	iot,
	iotData,
	onAvatarChange,
	onNameChange,
	identityId,
	credentials,
}: {
	iot: Iot
	iotData: IotData
	onAvatarChange: (args: { avatar: Blob }) => void
	onNameChange: (args: { name: string }) => void
	catId: string
	identityId: string
	credentials: {
		accessKeyId: string
		sessionToken: string
		secretAccessKey: string
	}
}) => {
	const [loading, setLoading] = useState(true)
	const [cat, setCat] = useState({
		name: catId,
		avatar: 'https://placekitten.com/75/75',
		version: 0,
	})
	const [reported, setReported] = useState()
	const [error, setError] = useState()

	useEffect(() => {
		let connection: device
		Promise.all([
			iot
				.describeThing({
					thingName: catId,
				})
				.promise(),
			new Promise(resolve => {
				console.log('Connecting ...')
				connection = new device({
					clientId: `user-${identityId}`,
					region: process.env.REACT_APP_REGION,
					host: process.env.REACT_APP_MQTT_ENDPOINT,
					protocol: 'wss',
					accessKeyId: credentials.accessKeyId,
					sessionToken: credentials.sessionToken,
					secretKey: credentials.secretAccessKey,
				})
				connection.on('connect', async () => {
					console.log('connected')
					connection.subscribe(
						`$aws/things/${catId}/shadow/update/documents`,
						undefined,
						() => {
							resolve(connection)
						},
					)
				})
				connection.on('message', (topic, payload) => {
					const reported = mergeReportedAndMetadata({
						shadow: JSON.parse(payload.toString()).current,
					})
					setReported(reported)
					console.log('Update reported state', catId, reported)
				})
			}),
			iotData
				.getThingShadow({
					thingName: catId,
				})
				.promise()
				.then(({ payload }) => (payload ? JSON.parse(payload.toString()) : {}))
				.catch(err => {
					console.error(err)
					return {}
				}),
		])
			.then(([{ thingName, attributes, version }, _, shadow]) => {
				setLoading(false)
				if (shadow.state) {
					const reported = mergeReportedAndMetadata({ shadow })
					console.log('Inital reported state', catId, reported)
					setReported(reported)
				}
				if (thingName) {
					setCat({
						name: (attributes && attributes.name) || thingName,
						avatar:
							(attributes && attributes.avatar) ||
							'https://placekitten.com/75/75',
						version: version || 0,
					})
				}
			})
			.catch(err => {
				setError(err)
				setLoading(false)
			})

		return () => {
			connection && connection.end()
		}
	}, [iot, iotData, catId, identityId, credentials])

	useEffect(() => {
		if (!loading && !error) {
			setTimeout(() => {
				window.requestAnimationFrame(() => {
					if (!window.localStorage.getItem('bifravst:cat:intro')) {
						intro.start()
						intro.onexit(() => {
							window.localStorage.setItem('bifravst:cat:intro', 'done')
						})
						console.log('Starting Intro.js')
					}
				})
			}, 1000)
		}
	}, [loading, error])

	if (loading || error)
		return (
			<Card>
				<CardBody>
					{loading && <Loading text={`Opening can for ${catId}...`} />}
					{error && <Error error={error} />}
				</CardBody>
			</Card>
		)
	const hasMap =
		reported &&
		reported.gps &&
		reported.gps.v &&
		reported.gps.v.lat &&
		reported.gps.v.lng
	return (
		<>
			{hasMap && (
				<Map
					position={{
						lat: reported.gps.v.lat.value as number,
						lng: reported.gps.v.lng.value as number,
					}}
					accuracy={reported.gps.v.acc && (reported.gps.v.acc.value as number)}
					heading={reported.gps.v.hdg && (reported.gps.v.hdg.value as number)}
					label={catId}
				/>
			)}
			{!hasMap && (
				<div className={'noMap'}>
					<span>
						<NoSignalIcon /> No position known.
					</span>
				</div>
			)}
			<Card>
				<CardHeader className={'cat'}>
					<AvatarPicker
						key={`${cat.version}`}
						onChange={blob => {
							// Display image directly
							const reader = new FileReader()
							reader.onload = (e: any) => {
								setCat({
									...cat,
									avatar: e.target.result,
								})
							}
							reader.readAsDataURL(blob)
							onAvatarChange({ avatar: blob })
						}}
					>
						<img
							src={cat.avatar}
							alt={cat.name}
							className={'avatar'}
							data-intro="Click here to upload a new image for your cat."
						/>
					</AvatarPicker>
					<h2 data-intro="Click here to edit the name of your cat.">
						<Editable
							key={`${cat.version}`}
							text={cat.name}
							onChange={v => {
								onNameChange({ name: v })
							}}
						/>
					</h2>
					{reported && (
						<>
							{reported.gps && reported.gps.v && (
								<div>
									{reported.gps.v.spd && (
										<span>
											<SpeedIcon />
											{Math.round(reported.gps.v.spd.value)}m/s
										</span>
									)}
									{reported.gps.v.alt && (
										<span>
											<AltitudeIcon />
											{Math.round(reported.gps.v.alt.value)}m
										</span>
									)}
									<span className={'time'}>
										<ReportedTime
											receivedAt={reported.gps.v.lat.receivedAt}
											reportedAt={reported.gps.ts.value}
										/>
									</span>
								</div>
							)}
							{reported.bat && reported.bat.v && (
								<div>
									<span>
										<BatteryIcon />
										{reported.bat.v.value}
									</span>
									<span className={'time'}>
										<ReportedTime
											receivedAt={reported.bat.v.receivedAt}
											reportedAt={reported.bat.ts.value}
										/>
									</span>
								</div>
							)}
						</>
					)}
				</CardHeader>
				{reported && reported.acc && reported.acc.v && (
					<CardBody>
						<div>
							<p>
								<strong>Motion</strong>
							</p>
							<AccelerometerDiagram
								values={reported.acc.v.map(
									({ value }: { value: number }) => value,
								)}
							/>
							<small>
								<ReportedTime
									reportedAt={reported.acc.ts.value}
									receivedAt={reported.acc.v[0].receivedAt}
								/>
							</small>
						</div>
					</CardBody>
				)}
			</Card>
		</>
	)
}

export const Cat = ({ catId }: { catId: string }) => (
	<CredentialsContext.Consumer>
		{credentials => (
			<IdentityIdContext.Consumer>
				{identityId => (
					<IotContext.Consumer>
						{({ iot, iotData }) => {
							const s3 = new S3({
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
							return (
								<ShowCat
									catId={catId}
									iot={iot}
									iotData={iotData}
									identityId={identityId}
									credentials={credentials}
									onAvatarChange={({ avatar }) => {
										avatarUploader({
											avatar,
										})
											.then(({ url }) => attributeUpdater({ avatar: url }))
											.catch(err => {
												console.error(err)
											})
									}}
									onNameChange={({ name }) => {
										attributeUpdater({ name }).catch(err => {
											console.error(err)
										})
									}}
								/>
							)
						}}
					</IotContext.Consumer>
				)}
			</IdentityIdContext.Consumer>
		)}
	</CredentialsContext.Consumer>
)