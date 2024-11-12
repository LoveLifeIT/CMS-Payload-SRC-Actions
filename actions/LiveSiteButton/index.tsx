import React from 'react';

const LiveSiteButton = () => {
	const handleClick = (e) => {
		e.preventDefault();
		const { protocol, hostname } = window.location;
		const url = process.env.PAYLOAD_PUBLIC_LIVE_SITE_URL || `https://love.life`;
		window.open(url, '_blank');
	};

	return (
		<button onClick={handleClick} style={{ cursor: 'pointer' }}>
			Live Site
		</button>
	);
};

export default LiveSiteButton;