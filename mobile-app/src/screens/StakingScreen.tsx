
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Card, Button } from '../components';
import { useWeb3 } from '../context/Web3Context';
import { CONTRACTS } from '../config/contracts';
import { AETH_TOKEN_ABI, STAKING_ABI } from '../config/abis';
import { ethers } from 'ethers';

export const StakingScreen: React.FC = () => {
	const { provider, address } = useWeb3();
	const [amount, setAmount] = useState('');
	const [staked, setStaked] = useState('');
	const [rewards, setRewards] = useState('');
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	const fetchStakingData = async () => {
		if (!provider || !address) return;
		setRefreshing(true);
		try {
			const staking = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, provider);
			const stakedAmt = await staking.getStakedAmount(address);
			const pending = await staking.getPendingRewards(address);
			setStaked(ethers.utils.formatEther(stakedAmt));
			setRewards(ethers.utils.formatEther(pending));
		} catch (e) {
			setStaked('0');
			setRewards('0');
		} finally {
			setRefreshing(false);
		}
	};

	useEffect(() => {
		fetchStakingData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [address]);

	const handleStake = async () => {
		if (!provider || !address || !amount) return;
		setLoading(true);
		try {
			const signer = provider.getSigner();
			const token = new ethers.Contract(CONTRACTS.AETH_TOKEN, AETH_TOKEN_ABI, signer);
			const staking = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, signer);
			// Approve if needed
			const allowance = await token.allowance(address, CONTRACTS.STAKING);
			const amt = ethers.utils.parseEther(amount);
			if (allowance.lt(amt)) {
				const txApprove = await token.approve(CONTRACTS.STAKING, amt);
				await txApprove.wait();
			}
			const tx = await staking.stake(amt);
			await tx.wait();
			Alert.alert('Staked successfully!');
			setAmount('');
			fetchStakingData();
		} catch (e) {
			const err = e as Error;
			Alert.alert('Stake failed', err.message || String(e));
		} finally {
			setLoading(false);
		}
	};

	const handleUnstake = async () => {
		if (!provider || !address || !amount) return;
		setLoading(true);
		try {
			const signer = provider.getSigner();
			const staking = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, signer);
			const amt = ethers.utils.parseEther(amount);
			const tx = await staking.unstake(amt);
			await tx.wait();
			Alert.alert('Unstaked successfully!');
			setAmount('');
			fetchStakingData();
		} catch (e) {
			const err = e as Error;
			Alert.alert('Unstake failed', err.message || String(e));
		} finally {
			setLoading(false);
		}
	};

	const handleClaim = async () => {
		if (!provider || !address) return;
		setLoading(true);
		try {
			const signer = provider.getSigner();
			const staking = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, signer);
			const tx = await staking.claimRewards();
			await tx.wait();
			Alert.alert('Rewards claimed!');
			fetchStakingData();
		} catch (e) {
			const err = e as Error;
			Alert.alert('Claim failed', err.message || String(e));
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<Card title="AETH Staking Dashboard">
				<Text style={styles.label}>Your Staked AETH:</Text>
				<Text style={styles.value}>{refreshing ? '...' : staked}</Text>
				<Text style={styles.label}>Pending Rewards:</Text>
				<Text style={styles.value}>{refreshing ? '...' : rewards}</Text>
				<Button title="Refresh" onPress={fetchStakingData} disabled={refreshing} style={styles.button} />
			</Card>
			<Card title="Stake / Unstake">
				<TextInput
					style={styles.input}
					placeholder="Amount"
					keyboardType="decimal-pad"
					value={amount}
					onChangeText={setAmount}
				/>
				<View style={{ flexDirection: 'row', marginBottom: 12 }}>
					<Button title="Stake" onPress={handleStake} disabled={loading} style={{ flex: 1, marginRight: 8 }} />
					<Button title="Unstake" onPress={handleUnstake} disabled={loading} style={{ flex: 1, marginLeft: 8 }} />
				</View>
				<Button title="Claim Rewards" onPress={handleClaim} disabled={loading} style={styles.button} />
				{loading && <ActivityIndicator style={{ marginTop: 16 }} />}
			</Card>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, padding: 16 },
	label: { color: '#aaa', fontSize: 14, marginTop: 8 },
	value: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
	input: { borderWidth: 1, borderColor: '#444', borderRadius: 8, padding: 12, marginBottom: 16, color: '#fff', backgroundColor: '#222' },
	button: { marginBottom: 12 },
});
 
