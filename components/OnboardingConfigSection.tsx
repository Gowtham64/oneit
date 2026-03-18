// Enhanced Onboarding Form Component with Google OU and Slack Configuration

import { useState } from 'react';
import { Building2, Users, Plus, X } from 'lucide-react';

interface OnboardingConfigProps {
    onConfigChange: (config: OnboardingConfig) => void;
}

export interface OnboardingConfig {
    googleOrgUnit: string;
    slackMemberType: 'MEMBER' | 'SINGLE_CHANNEL' | 'MULTI_CHANNEL';
    slackChannels: string[];
}

export function OnboardingConfigSection({ onConfigChange }: OnboardingConfigProps) {
    const [googleOrgUnit, setGoogleOrgUnit] = useState('/');
    const [slackMemberType, setSlackMemberType] = useState<'MEMBER' | 'SINGLE_CHANNEL' | 'MULTI_CHANNEL'>('MEMBER');
    const [slackChannels, setSlackChannels] = useState<string[]>([]);
    const [newChannel, setNewChannel] = useState('');

    const handleConfigUpdate = (updates: Partial<OnboardingConfig>) => {
        const config = {
            googleOrgUnit,
            slackMemberType,
            slackChannels,
            ...updates,
        };
        onConfigChange(config);
    };

    const handleGoogleOUChange = (value: string) => {
        setGoogleOrgUnit(value);
        handleConfigUpdate({ googleOrgUnit: value });
    };

    const handleSlackMemberTypeChange = (value: 'MEMBER' | 'SINGLE_CHANNEL' | 'MULTI_CHANNEL') => {
        setSlackMemberType(value);
        // Clear channels if switching to MEMBER
        if (value === 'MEMBER') {
            setSlackChannels([]);
            handleConfigUpdate({ slackMemberType: value, slackChannels: [] });
        } else {
            handleConfigUpdate({ slackMemberType: value });
        }
    };

    const addSlackChannel = () => {
        if (newChannel.trim() && !slackChannels.includes(newChannel.trim())) {
            const updated = [...slackChannels, newChannel.trim()];
            setSlackChannels(updated);
            setNewChannel('');
            handleConfigUpdate({ slackChannels: updated });
        }
    };

    const removeSlackChannel = (channel: string) => {
        const updated = slackChannels.filter(c => c !== channel);
        setSlackChannels(updated);
        handleConfigUpdate({ slackChannels: updated });
    };

    return (
        <div className="space-y-6">
            {/* Google Workspace Configuration */}
            <div className="p-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-500" />
                    Google Workspace Configuration
                </h3>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Organizational Unit (OU)
                    </label>
                    <select
                        value={googleOrgUnit}
                        onChange={(e) => handleGoogleOUChange(e.target.value)}
                        className="w-full p-3 bg-white/50 dark:bg-white/10 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="/">Root (/) - All Users</option>
                        <option value="/Engineering">/Engineering</option>
                        <option value="/Sales">/Sales</option>
                        <option value="/Marketing">/Marketing</option>
                        <option value="/HR">/HR</option>
                        <option value="/Finance">/Finance</option>
                        <option value="/Operations">/Operations</option>
                        <option value="/Support">/Support</option>
                        <option value="/Contractors">/Contractors</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-2">
                        Select the organizational unit where this user will be placed in Google Workspace.
                    </p>
                </div>
            </div>

            {/* Slack Configuration */}
            <div className="p-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    Slack Configuration
                </h3>

                <div className="space-y-4">
                    {/* Member Type Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Slack Member Type
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => handleSlackMemberTypeChange('MEMBER')}
                                className={`p-4 rounded-lg border-2 transition-all ${slackMemberType === 'MEMBER'
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-white/20 hover:border-purple-500/50'
                                    }`}
                            >
                                <div className="font-medium">Full Member</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Access to all public channels
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSlackMemberTypeChange('SINGLE_CHANNEL')}
                                className={`p-4 rounded-lg border-2 transition-all ${slackMemberType === 'SINGLE_CHANNEL'
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-white/20 hover:border-purple-500/50'
                                    }`}
                            >
                                <div className="font-medium">Single Channel Guest</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Access to one channel only
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSlackMemberTypeChange('MULTI_CHANNEL')}
                                className={`p-4 rounded-lg border-2 transition-all ${slackMemberType === 'MULTI_CHANNEL'
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-white/20 hover:border-purple-500/50'
                                    }`}
                            >
                                <div className="font-medium">Multi-Channel Guest</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Access to selected channels
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Channel Selection (for guests only) */}
                    {(slackMemberType === 'SINGLE_CHANNEL' || slackMemberType === 'MULTI_CHANNEL') && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Slack Channels {slackMemberType === 'SINGLE_CHANNEL' && '(Select 1)'}
                            </label>

                            {/* Add Channel Input */}
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newChannel}
                                    onChange={(e) => setNewChannel(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSlackChannel())}
                                    placeholder="Enter channel name (e.g., #general)"
                                    className="flex-1 p-3 bg-white/50 dark:bg-white/10 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <button
                                    type="button"
                                    onClick={addSlackChannel}
                                    disabled={slackMemberType === 'SINGLE_CHANNEL' && slackChannels.length >= 1}
                                    className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            </div>

                            {/* Selected Channels */}
                            {slackChannels.length > 0 && (
                                <div className="space-y-2">
                                    {slackChannels.map((channel) => (
                                        <div
                                            key={channel}
                                            className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/20"
                                        >
                                            <span className="font-mono text-sm">{channel}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeSlackChannel(channel)}
                                                className="text-red-500 hover:text-red-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {slackMemberType === 'SINGLE_CHANNEL' && slackChannels.length === 0 && (
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                    ⚠️ Single channel guest requires exactly one channel
                                </p>
                            )}
                        </div>
                    )}

                    {slackMemberType === 'MEMBER' && (
                        <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <p className="text-sm">
                                ✅ Full member will have access to all public channels in the workspace.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
