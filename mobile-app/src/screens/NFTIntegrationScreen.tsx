import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Image} from 'react-native';
import {useWeb3} from '../context/Web3Context';
import {Card} from '../components/Card';
import {Button} from '../components/Button';
import {theme} from '../config/theme';

interface NFT {
  id: string;
  name: string;
  collection: string;
  image: string;
  price: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  owner: string;
}

export const NFTIntegrationScreen: React.FC = () => {
  const {isConnected, address} = useWeb3();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'owned' | 'marketplace'>('owned');

  const loadNFTs = useCallback(async () => {
    setIsLoading(true);
    try {
      // Mock data - in real app, this would come from NFT marketplaces and user's wallet
      const mockNFTs: NFT[] =
        activeTab === 'owned'
          ? [
              {
                id: '1',
                name: 'Cosmic Explorer #001',
                collection: 'Aetheron Space Collection',
                image: 'https://via.placeholder.com/300x300/00D4FF/FFFFFF?text=NFT+1',
                price: 0,
                rarity: 'Legendary',
                owner: address || '',
              },
              {
                id: '2',
                name: 'Starship Commander',
                collection: 'Aetheron Space Collection',
                image: 'https://via.placeholder.com/300x300/FF6B35/FFFFFF?text=NFT+2',
                price: 0,
                rarity: 'Epic',
                owner: address || '',
              },
            ]
          : [
              {
                id: '3',
                name: 'Galactic Ranger #045',
                collection: 'Space Explorers',
                image: 'https://via.placeholder.com/300x300/7209B7/FFFFFF?text=NFT+3',
                price: 0.5,
                rarity: 'Rare',
                owner: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
              },
              {
                id: '4',
                name: 'Nebula Guardian',
                collection: 'Cosmic Defenders',
                image: 'https://via.placeholder.com/300x300/F72585/FFFFFF?text=NFT+4',
                price: 1.2,
                rarity: 'Epic',
                owner: '0x8ba1f109551bD4328030126452617686AF61172',
              },
            ];
      setNfts(mockNFTs);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, address]);

  useEffect(() => {
    if (isConnected) {
      loadNFTs();
    }
  }, [isConnected, activeTab, loadNFTs]);

  const buyNFT = async (nft: NFT) => {
    // In real app, this would integrate with NFT marketplace smart contracts
    console.log(`Purchasing ${nft.name} for ${nft.price} ETH`);
  };

  const transferNFT = async (nft: NFT) => {
    // In real app, this would open a transfer modal
    console.log(`Transferring ${nft.name}`);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common':
        return '#9E9E9E';
      case 'Rare':
        return '#2196F3';
      case 'Epic':
        return '#9C27B0';
      case 'Legendary':
        return '#FF9800';
      default:
        return theme.colors.textSecondary;
    }
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>NFT Integration</Text>
          <Text style={styles.subtitle}>Connect your wallet to view and trade NFTs</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NFT Integration</Text>
        <Text style={styles.headerSubtitle}>Explore, collect, and trade space-themed NFTs</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'owned' && styles.activeTab]}
          onPress={() => setActiveTab('owned')}>
          <Text style={[styles.tabText, activeTab === 'owned' && styles.activeTabText]}>
            My NFTs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'marketplace' && styles.activeTab]}
          onPress={() => setActiveTab('marketplace')}>
          <Text style={[styles.tabText, activeTab === 'marketplace' && styles.activeTabText]}>
            Marketplace
          </Text>
        </TouchableOpacity>
      </View>

      {/* NFT Grid */}
      <View style={styles.nftGrid}>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading NFTs...</Text>
        ) : (
          nfts.map(nft => (
            <Card key={nft.id} style={styles.nftCard}>
              <Image source={{uri: nft.image}} style={styles.nftImage} />
              <View style={styles.nftInfo}>
                <Text style={styles.nftName} numberOfLines={1}>
                  {nft.name}
                </Text>
                <Text style={styles.collectionName} numberOfLines={1}>
                  {nft.collection}
                </Text>
                <View style={styles.nftFooter}>
                  <View style={[styles.rarityBadge, {backgroundColor: getRarityColor(nft.rarity)}]}>
                    <Text style={styles.rarityText}>{nft.rarity}</Text>
                  </View>
                  {nft.price > 0 && <Text style={styles.priceText}>{nft.price} ETH</Text>}
                </View>
              </View>

              {activeTab === 'owned' ? (
                <Button
                  title="Transfer"
                  onPress={() => transferNFT(nft)}
                  style={styles.actionButton}
                  fullWidth
                />
              ) : (
                <Button
                  title="Buy Now"
                  onPress={() => buyNFT(nft)}
                  style={styles.actionButton}
                  fullWidth
                />
              )}
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    margin: 20,
    marginTop: 0,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  nftGrid: {
    padding: 20,
    paddingTop: 0,
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  nftCard: {
    marginBottom: 16,
  },
  nftImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  nftInfo: {
    marginBottom: 12,
  },
  nftName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  collectionName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  nftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  actionButton: {
    marginTop: 8,
  },
});
