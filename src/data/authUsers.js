import data from './data.json';

export const DEMO_PASSWORD = data.demoUsers[0].password;
export const DEMO_USERS = data.demoUsers.map(user => {
	const publicUser = { ...user };
	delete publicUser.password;
	return publicUser;
});