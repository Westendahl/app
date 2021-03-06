import { Iot, S3 } from 'aws-sdk'
import { v4 } from 'uuid'
import { DeviceUpgradeFirmwareJob } from './listUpgradeFirmwareJobs'

export const upgradeFirmware = ({
	s3,
	iot,
	bucketName,
}: {
	s3: S3
	iot: Iot
	bucketName: string
}) => async ({
	data,
	file,
	thingArn,
	version,
	targetBoard,
}: {
	data: Blob
	file: File
	thingArn: string
	version: string
	targetBoard: string
}): Promise<DeviceUpgradeFirmwareJob> => {
	const jobId = v4()
	console.log({
		Bucket: bucketName,
		Key: jobId,
		Body: data,
		ContentLength: file.size,
		ContentType: 'text/octet-stream',
	})
	await s3
		.putObject({
			Bucket: bucketName,
			Key: jobId,
			Body: data,
			ContentLength: file.size,
			ContentType: 'text/octet-stream',
		})
		.promise()
	const description = `Update ${thingArn.split('/')[1]} to version ${version}.`
	await iot
		.createJob({
			jobId,
			targets: [thingArn],
			document: JSON.stringify({
				operation: 'app_fw_update',
				size: file.size,
				filename: file.name,
				location: {
					protocol: 'https',
					host: `${bucketName}.s3.amazonaws.com`,
					path: `${jobId}`,
				},
				fwversion: version,
				targetBoard,
			}),
			description,
			targetSelection: 'SNAPSHOT',
		})
		.promise()
	return {
		jobId,
		description,
		status: 'QUEUED',
		document: {
			size: file.size,
			fwversion: version,
			filename: file.name,
			targetBoard,
			location: `https://${bucketName}.s3.amazonaws.com/${jobId}`,
		},
		queuedAt: new Date(),
		executionNumber: 0,
	}
}
