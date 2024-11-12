import React from 'react';

const PREVIEW_URL = (
	process.env.PAYLOAD_PUBLIC_PREVIEW_STATIC_URL ||
	'http://preview.love.life'
)

const PreviewButton = () => {
	const handleClick = (e) => {
		e.preventDefault();
		window.open(PREVIEW_URL, 'preview');
	};

	return (
		<button onClick={handleClick} style={{ cursor: 'pointer' }}>
			Preview Site
		</button>
	);
};

export default PreviewButton;