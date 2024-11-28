import {
  BrandMode,
  useAccountAction,
} from "@/components/hooks/useAccountAction";
import { useWalkThrough } from "@/components/hooks/useWalkThrough";
import { useAuth } from "@/components/lib/auth/Provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  findNodeHandle,
  FlatList,
  Image,
  LayoutChangeEvent,
  RefreshControl,
  ScrollView,
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
import { getAllBrands } from "../api/routes/get-all-brands";
import { WalletType } from "@/components/lib/auth/types";
import { HasTrustOnPageAsset } from "../api/routes/has-trust-on-pageAsset";
import { GetXDR4Follow } from "../api/routes/get-XDR4-Follow";
import { submitSignedXDRToServer4User } from "@/components/utils/submitSignedXDRtoServer4User";
import { FollowBrand } from "../api/routes/follow-brand";
import { UnFollowBrand } from "../api/routes/unfollow-brand";
import { Color } from "@/components/utils/all-colors";
import LoadingScreen from "@/components/Loading";
import { Walkthrough } from "@/components/walkthrough/WalkthroughProvider";
import { toast, ToastPosition } from "@backpackapp-io/react-native-toast";

type Brand = {
  id: string;
  first_name: string;
  followed_by_current_user: boolean;
  last_name: string;
  logo: string;
};
type ButtonLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export default function CreatorPage() {
  const { user, isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("available");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);
  const [unfollowLoadingId, setUnfollowLoadingId] = useState<string | null>(
    null
  );

  const [buttonLayouts, setButtonLayouts] = useState<ButtonLayout[]>([]);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const { data: walkthroughData } = useWalkThrough();
  const router = useRouter();
  const scrollViewRef = useRef(null);

  const { data: accountActionData, setData: setAccountActionData } =
    useAccountAction();
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const steps = [
    {
      target: buttonLayouts[0],
      title: "Follow Mode",
      content:
        "In Follow Mode, see pins for followed brands only. Switch to General Mode to view all brand pins.",
    },
    {
      target: buttonLayouts[1],
      title: "Search for Brands",
      content:
        "Use the search bar to look for any brand on the platform by typing in the brand name in the search bar, then pressing the search icon",
    },
    {
      target: buttonLayouts[2],
      title: "Brand Lists",
      content:
        "Click on 'Available Brands' to view all brands, or 'Followed Brands' to see the ones you've followed.",
    },
    {
      target: buttonLayouts[3],
      title: "Follow Brands",
      content:
        "“To follow a brand, press the follow button next to the brand name. To unfollow a brand, press the unfollow button next to the brand name.",
    },
  ];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["AllBrands"],
    queryFn: getAllBrands,
  });

  const onButtonLayout = useCallback(
    (event: LayoutChangeEvent, index: number) => {
      if (scrollViewRef.current) {
        const scrollViewHandle = findNodeHandle(scrollViewRef.current);
        if (scrollViewHandle) {
          event.target.measureLayout(
            scrollViewHandle,
            (x, y, width, height) => {
              setButtonLayouts((prevLayouts) => {
                const newLayouts = [...prevLayouts];
                newLayouts[index] = { x, y, width, height };
                return newLayouts;
              });
            },
            () => console.error("Failed to measure layout")
          );
        }
      }
    },
    []
  );
  const checkFirstTimeSignIn = async () => {

    if (walkthroughData.showWalkThrough) {
      setShowWalkthrough(true);
    } else {
      setShowWalkthrough(false);
    }
  };

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
            toast("Followed Creator Successfully!", {

              duration: 3000,
              position: ToastPosition.BOTTOM,
              styles: {
                view: { backgroundColor: Color.wadzzo, borderRadius: 8 },
              },
            });
          } else {
            toast("Not enough Wadzzo, need minimum 25 wadzzo to follow", {
              duration: 3000,
              position: ToastPosition.BOTTOM,
              styles: {
                view: { backgroundColor: Color.light.error, borderRadius: 8 },
                text: { color: 'white' }
              },
            });
            setFollowLoadingId(null);
          }
        } else {

          toast("Creator has not setup page asset yet", {
            duration: 3000,
            position: ToastPosition.BOTTOM,
            styles: {
              view: { backgroundColor: Color.light.error, borderRadius: 8 },
              text: { color: 'white' }
            },
          });
          setFollowLoadingId(null);
        }
      } else {
        await FollowBrand({ brand_id });
        toast("Followed Creator Successfully!", {

          duration: 3000,
          position: ToastPosition.BOTTOM,
          styles: {
            view: { backgroundColor: Color.wadzzo, borderRadius: 8 },
          },
        });
      }
    },
    onSuccess: (data) => {

      queryClient.invalidateQueries({
        queryKey: ["AllBrands"],
      });

      setFollowLoadingId(null);
    },
    onError: (error) => {
      toast("Followed Creator Failed!", {
        duration: 3000,
        position: ToastPosition.BOTTOM,
        styles: {
          view: { backgroundColor: Color.light.error, borderRadius: 8 },
          text: { color: 'white' }
        },
      });
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
      toast("unfollowed Creator Successfully!", {

        duration: 3000,
        position: ToastPosition.BOTTOM,
        styles: {
          view: { backgroundColor: Color.wadzzo, borderRadius: 8 },
        },
      });
      setUnfollowLoadingId(null);
    },
    onError: (error) => {
      console.error("Error unfollowing brand:", error);
      toast("unfollowed Creator Failed!", {

        duration: 3000,
        position: ToastPosition.BOTTOM,
        styles: {
          view: { backgroundColor: Color.light.error, borderRadius: 8 },
          text: { color: 'white' }
        },
      });
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
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/Login");
    } else {
      checkFirstTimeSignIn(); // Check if it's the first sign-in
    }
  }, [isAuthenticated, walkthroughData]);

  if (isLoading) return <LoadingScreen />;
  if (error) return <Text>Error: {error.message}</Text>;

  const renderBrandItem = ({ item, index }: { item: Brand; index: number }) => (
    <View style={styles.brandItem}>
      <Image source={{ uri: item.logo }} style={styles.brandImage} />
      <Text style={styles.brandName}>{item.first_name}</Text>
      <Button
        onLayout={(event: LayoutChangeEvent) => {
          if (index === 0) {
            onButtonLayout(event, 3);
          }
        }}
        disabled={followLoadingId === item.id || unfollowLoadingId === item.id}
        mode={item.followed_by_current_user ? "outlined" : "contained"}
        onPress={() => toggleFollow(item.id, item.followed_by_current_user)}
        style={styles.followButton}
      >
        {item.followed_by_current_user ? (
          unfollowLoadingId === item.id ? (
            <ActivityIndicator size={'small'} color="black" />
          ) : (
            "Unfollow"
          )
        ) : followLoadingId === item.id ? (
          <ActivityIndicator size={'small'} color="black" />
        ) : (
          "Follow"
        )}
      </Button>
    </View>
  );

  return (
    <View style={styles.container} ref={scrollViewRef}>
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
          <View
            style={styles.switchWrapper}
            onLayout={(event) => onButtonLayout(event, 0)}
          >
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
          onLayout={(event) => onButtonLayout(event, 1)}
          placeholder="Search creators"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <View
          style={styles.tabContainer}
          onLayout={(event) => onButtonLayout(event, 2)}
        >
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
          showsVerticalScrollIndicator={false}
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
      {showWalkthrough && (
        <Walkthrough steps={steps} onFinish={() => setShowWalkthrough(false)} />
      )}
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
