import React, {useState} from 'react';
import {useAuth, useConfig} from 'payload/components/utilities';

const PublishButton = (input: any) => {

	const {user} = useAuth();
	const {serverURL, routes: {api}} = useConfig();
	const [isLoading, setIsLoading] = useState(false);

	const handleClick = async () => {

		if (isLoading) return; // Prevent multiple clicks

		setIsLoading(true);

		try {

			const response = await fetch(`${serverURL}${api}/publish`, {
				method: 'POST',
			});

			if (response.ok) {
				alert('The site has been published and the CDN is being updated. It may take a few minutes for the changes to be visible.');
			} else {
				alert('There was an error publishing the site. Please check the console for more information.');
			}

		} catch (error) {
			console.error('Error publishing the site:', error);
			alert('There was an error publishing the site. Please check the console for more information.');
		} finally {
			setIsLoading(false);
		}
	};

	if (user.roles === 'admin') return (
		<button onClick={handleClick} type="button" style={{cursor: 'pointer'}} disabled={isLoading}>
			{isLoading ? 'Publishing...' : 'Publish Site'}
		</button>
	)
	else return null;

};

export default PublishButton;