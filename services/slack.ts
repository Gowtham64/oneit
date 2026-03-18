import axios from 'axios';

const SLACK_API_URL = 'https://slack.com/api';

const getSlackHeaders = () => {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) {
        throw new Error('SLACK_BOT_TOKEN not configured');
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

/**
 * Invite user to Slack as a full member
 */
export async function inviteToSlack(email: string) {
    try {
        const response = await axios.post(
            `${SLACK_API_URL}/admin.users.invite`,
            {
                email,
                team_id: process.env.SLACK_TEAM_ID,
                channel_ids: process.env.SLACK_DEFAULT_CHANNELS?.split(',') || [],
            },
            { headers: getSlackHeaders() }
        );

        if (!response.data.ok) {
            throw new Error(response.data.error || 'Failed to invite user to Slack');
        }

        return response.data;
    } catch (error: any) {
        console.error('Error inviting user to Slack:', error);
        throw error;
    }
}

/**
 * Add user to Slack as a guest (single or multi-channel)
 */
export async function addToSlackChannels(
    email: string,
    channels: string[],
    guestType: 'single_channel_guest' | 'multi_channel_guest' = 'multi_channel_guest'
) {
    try {
        // First, invite the user as a guest
        const inviteResponse = await axios.post(
            `${SLACK_API_URL}/admin.users.invite`,
            {
                email,
                team_id: process.env.SLACK_TEAM_ID,
                channel_ids: channels,
                is_restricted: guestType === 'single_channel_guest',
                is_ultra_restricted: guestType === 'single_channel_guest',
            },
            { headers: getSlackHeaders() }
        );

        if (!inviteResponse.data.ok) {
            throw new Error(inviteResponse.data.error || 'Failed to invite guest to Slack');
        }

        return inviteResponse.data;
    } catch (error: any) {
        console.error('Error adding user to Slack channels:', error);
        throw error;
    }
}

/**
 * Remove user from Slack
 */
export async function removeFromSlack(email: string) {
    try {
        // First, find the user by email
        const userResponse = await axios.post(
            `${SLACK_API_URL}/users.lookupByEmail`,
            { email },
            { headers: getSlackHeaders() }
        );

        if (!userResponse.data.ok) {
            throw new Error('User not found in Slack');
        }

        const userId = userResponse.data.user.id;

        // Then deactivate the user
        const deactivateResponse = await axios.post(
            `${SLACK_API_URL}/admin.users.remove`,
            {
                team_id: process.env.SLACK_TEAM_ID,
                user_id: userId,
            },
            { headers: getSlackHeaders() }
        );

        if (!deactivateResponse.data.ok) {
            throw new Error(deactivateResponse.data.error || 'Failed to remove user from Slack');
        }

        return deactivateResponse.data;
    } catch (error: any) {
        console.error('Error removing user from Slack:', error);
        throw error;
    }
}

/**
 * Get list of Slack channels
 */
export async function getSlackChannels() {
    try {
        const response = await axios.get(
            `${SLACK_API_URL}/conversations.list`,
            {
                headers: getSlackHeaders(),
                params: {
                    types: 'public_channel,private_channel',
                    exclude_archived: true,
                },
            }
        );

        if (!response.data.ok) {
            throw new Error(response.data.error || 'Failed to fetch Slack channels');
        }

        return response.data.channels;
    } catch (error: any) {
        console.error('Error fetching Slack channels:', error);
        throw error;
    }
}
