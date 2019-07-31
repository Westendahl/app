import React, { useState, useEffect } from 'react'
import moment from 'moment'

const getDiffInSeconds = (ts: Date) =>
	(Date.now() - ts.getTime()) / 1000

export const RelativeTime = ({ ts }: { ts: Date }) => {
	const [label, setLabel] = useState(moment(ts).fromNow())
	const [diffInSeconds, setDiffInSeconds] = useState(getDiffInSeconds(ts))

	useEffect(() => {
		const updateDiffInSeconds = () => {
			const d = getDiffInSeconds(ts)
			setDiffInSeconds(d)
			setLabel(moment(ts).fromNow())
		}

		let t: NodeJS.Timeout

		if (Math.abs(diffInSeconds) < 60) {
			t = global.setTimeout(updateDiffInSeconds, 1000 * 5)
		} else {
			t = global.setTimeout(updateDiffInSeconds, 1000 * 60)
		}

		return () => {
			clearTimeout(t)
		}
	}, [diffInSeconds, ts])

	return <time dateTime={ts.toISOString()}>{label}</time>
}
