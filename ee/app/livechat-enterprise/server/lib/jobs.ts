import { autoTransferToNewAgent } from './Helper';

export const autoTransferVisitorJob = async ({ attrs: { data } }: any = {}): Promise<void> => {
	const { roomId, transferredBy } = data;
	try {
		await autoTransferToNewAgent(roomId, transferredBy);
	} catch (err) {
		console.error(err);
	}
};
