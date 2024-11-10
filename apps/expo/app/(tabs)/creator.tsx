import {
  BrandMode,
  useAccountAction,
} from "@/components/hooks/useAccountAction";
import LoadingScreen from "@/components/Loading";
import { FollowBrand } from "@api/routes/follow-brand";
import { getAllBrands } from "@api/routes/get-all-brands";
import { GetXDR4Follow } from "@api/routes/get-XDR4-Follow";
import { HasTrustOnPageAsset } from "@api/routes/has-trust-on-pageAsset";
import { UnFollowBrand } from "@api/routes/unfollow-brand";
import { submitSignedXDRToServer4User } from "@app/utils/submitSignedXDRtoServer4User";
import { useAuth } from "@auth/Provider";
import { WalletType } from "@auth/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Color } from "app/utils/Colors";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Button,
  Chip,
  Searchbar,
  Switch,
  Text,
} from "react-native-paper";

type Brand = {
  id: string;
  first_name: string;
  followed_by_current_user: boolean;
  last_name: string;
  logo: string;
};

export default function CreatorPage() {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("available");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);
  const [unfollowLoadingId, setUnfollowLoadingId] = useState<string | null>(
    null
  );

  const router = useRouter();

  const { data: accountActionData, setData: setAccountActionData } =
    useAccountAction();
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["AllBrands"],
    queryFn: getAllBrands,
  });

  const followMutation = useMutation({
    mutationFn: async ({
      brand_id,
      wallate,
    }: {
      brand_id: string;
      wallate: WalletType;
    }) => {
      setFollowLoadingId(brand_id);
      const hasTrust = await HasTrustOnPageAsset({ brand_id });
      if (!hasTrust) {
        const xdr = await GetXDR4Follow({ brand_id, wallate });
        if (wallate == WalletType.albedo) {
          router.push({
            pathname: "/albedo",
            params: { xdr: xdr, brandId: brand_id },
          });
          return;
        }
        if (xdr) {
          const res = await submitSignedXDRToServer4User(xdr);
          if (res) {
            await FollowBrand({ brand_id });
          } else {
            Alert.alert("You haven't enough wadzzo to follow this brand");
            setFollowLoadingId(null);
          }
        } else {
          Alert.alert("This brand doesn't have page asset");
          setFollowLoadingId(null);
        }
      } else {
        return await FollowBrand({ brand_id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["AllBrands"],
      });
      setFollowLoadingId(null);
    },
    onError: (error) => {
      console.error("Error following brand:", error);
      setFollowLoadingId(null);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async ({ brand_id }: { brand_id: string }) => {
      setUnfollowLoadingId(brand_id);
      return await UnFollowBrand({ brand_id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["AllBrands"],
      });
      setUnfollowLoadingId(null);
    },
    onError: (error) => {
      console.error("Error unfollowing brand:", error);
      setUnfollowLoadingId(null);
    },
  });

  const toggleFollow = (brandId: string, isAlreadyFollowed: boolean) => {
    if (isAlreadyFollowed) {
      setUnfollowLoadingId(brandId);
      unfollowMutation.mutate({ brand_id: brandId });
    } else {
      if (user) {
        setFollowLoadingId(brandId);
        followMutation.mutate({ brand_id: brandId, wallate: user.walletType });
      } else {
        console.log("user is not authenticated");
      }
    }
  };
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  useEffect(() => {
    if (data) {
      setBrands(data.users);
    }
  }, [data]);

  useEffect(() => {
    queryClient.refetchQueries({
      queryKey: ["MapsAllPins"],
    });
  }, [accountActionData.brandMode]);

  const filteredBrands = brands.filter((brand) => {
    const matchesSearch = brand.first_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (activeTab === "followed") {
      return matchesSearch && brand.followed_by_current_user;
    }
    return matchesSearch;
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <Text>Error loading brands</Text>;

  const renderBrandItem = ({ item }: { item: Brand }) => (
    <View style={styles.brandItem}>
      <Image source={{ uri: item.logo }} style={styles.brandImage} />
      <Text style={styles.brandName}>{item.first_name}</Text>
      <Button
        disabled={followLoadingId === item.id || unfollowLoadingId === item.id}
        mode={item.followed_by_current_user ? "outlined" : "contained"}
        onPress={() => toggleFollow(item.id, item.followed_by_current_user)}
        style={styles.followButton}
      >
        {item.followed_by_current_user ? (
          followLoadingId === item.id ? (
            <ActivityIndicator size={"small"} />
          ) : (
            "Unfollow"
          )
        ) : unfollowLoadingId === item.id ? (
          <ActivityIndicator size={"small"} />
        ) : (
          "Follow"
        )}
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header
        style={{
          backgroundColor: Color.wadzzo,
          borderBottomRightRadius: 8,
          borderBottomLeftRadius: 8,
        }}
      >
        <Appbar.Content
          title="Brands"
          titleStyle={{
            fontSize: 20,
            color: "white",
            fontWeight: "bold",
            textAlign: "center",
          }}
        />
        <View style={styles.pinCollectionContainer}>
          <View style={styles.switchWrapper}>
            <Text
              style={[
                styles.switchLabel,
                !BrandMode.GENERAL && styles.activeSwitchLabel,
              ]}
            >
              General
            </Text>
            <Switch
              value={accountActionData.brandMode === BrandMode.FOLLOW}
              onValueChange={(value) =>
                setAccountActionData({
                  ...accountActionData,
                  brandMode: value ? BrandMode.FOLLOW : BrandMode.GENERAL,
                })
              }
              color={Color.wadzzo}
            />
            <Text
              style={[
                styles.switchLabel,
                accountActionData.brandMode === BrandMode.FOLLOW &&
                  styles.activeSwitchLabel,
              ]}
            >
              Follow
            </Text>
          </View>
        </View>
      </Appbar.Header>

      <View style={styles.content}>
        <Searchbar
          placeholder="Search creators"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <View style={styles.tabContainer}>
          <Chip
            selected={activeTab === "available"}
            onPress={() => setActiveTab("available")}
            style={styles.tab}
          >
            Available Brands
          </Chip>
          <Chip
            selected={activeTab === "followed"}
            onPress={() => setActiveTab("followed")}
            style={styles.tab}
          >
            Followed Brands
          </Chip>
        </View>

        <FlatList
          data={filteredBrands}
          renderItem={renderBrandItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.brandList, { paddingBottom: 80 }]}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No brands found</Text>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
  },
  modeSelector: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  pinCollectionContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pinCollectionTextContainer: {},
  pinCollectionTitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  pinCollectionDescription: {
    fontSize: 12,
    color: "#666",
  },
  switchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Color.white,
    borderRadius: 20,
    padding: 4,
  },
  switchLabel: {
    marginHorizontal: 8,
    fontSize: 12,
    color: "#666",
  },
  activeSwitchLabel: {
    fontWeight: "bold",
    color: "#000",
  },
  searchBar: {
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  tab: {
    marginRight: 8,
  },
  brandList: {
    paddingBottom: 16,
  },
  brandItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
  },
  brandImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  brandName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
  },
  followButton: {
    minWidth: 100,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#888",
  },
});
