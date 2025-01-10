import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  findNodeHandle,
  FlatList,
  LayoutChangeEvent,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import {
  Appbar,
  Button,
  Card,
  Chip,
  Menu,
  Text,
  Title,
} from "react-native-paper";
import RenderHtml from "react-native-render-html";

import { useQuery } from "@tanstack/react-query";

import { useRouter } from "expo-router";
import { Bounty } from "@/components/types/BountyTypes";
import { useAuth } from "@/components/lib/auth/Provider";
import { useWalkThrough } from "@/components/hooks/useWalkThrough";
import { useBounty } from "@/components/hooks/useBounty";
import { useModal } from "@/components/hooks/useModal";
import { getAllBounties } from "../../api/routes/get-all-bounties";
import { getUserPlatformAsset } from "../../api/routes/get-user-platformAsset";
import LoadingScreen from "@/components/Loading";
import { addrShort } from "@/components/utils/AddrShort";
import { Walkthrough } from "@/components/walkthrough/WalkthroughProvider";
import { Color } from "@/components/utils/all-colors";
import { toast } from "@backpackapp-io/react-native-toast";

type ButtonLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export default function BountyScreen() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const scrollViewRef = useRef(null);
  const [buttonLayouts, setButtonLayouts] = useState<ButtonLayout[]>([]);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { data: walkthroughData } = useWalkThrough();
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const { setData } = useBounty();
  const { onOpen } = useModal();
  const router = useRouter();

  const steps = [
    {
      target: buttonLayouts[0],
      title: "Filter Bounty",
      content:
        "User can filter bounty between Joined and Not Joined Bounty List.",
    },
    {
      target: buttonLayouts[1],
      title: "View/Join Bounty",
      content:
        "Clicking 'Join Bounty' lets users view details and join. If already joined, they can view details only.",
    },
  ];
  const dummyBounties: Bounty[] = [
    {
      title: "Bounty 1",
      description: "This is a bounty description",
      priceInUSD: 100,
      priceInBand: 100,
      status: "APPROVED",
      isJoined: false,
      currentWinnerCount: 1,
      _count: {
        participants: 10,
        BountyWinner: 1,
      },
      imageUrls: ["https://app.wadzzo.com/images/loading.png"],
      totalWinner: 5,
      BountyWinner: [],
      creator: {
        name: "Creator 1",
        profileUrl: "https://app.wadzzo.com/images/loading.png",
      },
      id: "1",
      creatorId: "0x1234567890",
      requiredBalance: 100,
      isOwner: false,
    },
  ];

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
  const response = useQuery({
    queryKey: ["bounties"],
    queryFn: getAllBounties,
  });

  const balanceRes = useQuery({
    queryKey: ["balance"],
    queryFn: getUserPlatformAsset,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await response.refetch();
    setRefreshing(false);
  };

  const bountyList = response.data?.allBounty || [];
  const filteredBounties = useMemo(() => {
    return bountyList.filter((bounty: Bounty) => {
      if (selectedFilter === "Joined") return bounty.isJoined;
      if (selectedFilter === "Not Joined") return !bounty.isJoined && !bounty.isOwner;
      return true; // "All"
    });
  }, [selectedFilter, bountyList]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/Login");
    } else {
      checkFirstTimeSignIn(); // Check if it's the first sign-in
    }
  }, [isAuthenticated, walkthroughData]);

  if (response.isLoading) return <LoadingScreen />;
  const toggleJoin = (id: string, isAlreadyJoin: boolean, bounty: Bounty) => {
    if (isAlreadyJoin || bounty.isOwner) {
      setData({ item: bounty });
      router.push("/(tabs)/bounty/:id");
      // navigation.navigate("SingleBountyItem", { item: bounty });
    } else if (bounty.totalWinner === bounty._count.BountyWinner) {
      toast.error("All Winners Declared");
    } else {
      onOpen("JoinBounty", { bounty: bounty, balance: balanceRes.data });
    }
  };
  const renderBountyItem = ({
    item,
    index,
  }: {
    item: Bounty;
    index: number;
  }) => {
    return (
      <Card style={styles.card}>
        <Card.Cover
          source={{
            uri:
              item.imageUrls[0] ?? "https://app.wadzzo.com/images/loading.png",
          }}
          style={styles.cardCover}
        />
        <Card.Content>
          <Title>{item.title?.slice(0, 65)}</Title>
          <View
            style={{
              marginBottom: 8,
              maxHeight: 150,
              minHeight: 150,
            }}
          >
            <RenderHtml
              contentWidth={Dimensions.get("window").width}
              source={{
                html:
                  item.description.length > 200
                    ? item.description.slice(0, 200)
                    : item.description,
              }}
            />
          </View>
          <View style={styles.detailsContainer}>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            >
              {item.status}
            </Chip>
            <Text style={styles.prizeText}>
              Prize: {item.priceInUSD.toFixed(2)}$
            </Text>
            <Text style={styles.prizeText}>
              Prize : {item.priceInBand.toFixed(2)} Wadzzo
            </Text>
          </View>
          <Text style={styles.participantsText}>
            Participants: {item._count.participants}
          </Text>
          {item.BountyWinner && (
            <Text style={styles.winnerText}>
              {item.totalWinner - item._count.BountyWinner > 1 ? ` ${(item.totalWinner - item._count.BountyWinner)} Winners Left` : item.totalWinner - item._count.BountyWinner === 1 ? `${(item.totalWinner - item._count.BountyWinner)} Winner Left` : "Winner Declared"}
            </Text>
          )}
        </Card.Content>
        <Card.Actions>
          <Button
            onLayout={(event: LayoutChangeEvent) => {
              if (index === 0) {
                // Only apply layout for the button when index is 1
                onButtonLayout(event, 1);
              }
            }}
            style={{ flex: 1 }}
            disabled={item.status === "REJECTED"}
            mode={item.isJoined ? "outlined" : "contained"}
            onPress={() => toggleJoin(item.id, item.isJoined, item)}
          >
            {item.isJoined || item.isOwner ? "View Bounty" : item.totalWinner !== item._count.BountyWinner ? "Join Bounty" : "Finished"}
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  return (
    <View style={styles.container} ref={scrollViewRef}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content
          titleStyle={{
            color: "white",
          }}
          title="Bounty"
          style={styles.title}
        />

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="sort"
              onLayout={(event) => onButtonLayout(event, 0)}
              iconColor="white"
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setSelectedFilter("All");
              setMenuVisible(false);
            }}
            title="All"
            style={selectedFilter === "All" ? styles.selectedMenuItem : null} // Highlight selected option
          />
          <Menu.Item
            onPress={() => {
              setSelectedFilter("Joined");
              setMenuVisible(false);
            }}
            title="Joined"
            style={selectedFilter === "Joined" ? styles.selectedMenuItem : null} // Highlight selected option
          />
          <Menu.Item
            onPress={() => {
              setSelectedFilter("Not Joined");
              setMenuVisible(false);
            }}
            title="Not Joined"
            style={
              selectedFilter === "Not Joined" ? styles.selectedMenuItem : null
            } // Highlight selected option
          />
        </Menu>

        {/* <Appbar.Action
          iconColor="white"
          icon="dots-vertical"
          onPress={() => {}}
        /> */}
      </Appbar.Header>
      {
        showWalkthrough ? renderBountyItem({ item: dummyBounties[0], index: 0 }) :
          <>
            {filteredBounties.length === 0 && (
              <View
                style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
              >
                <Text>No Bounty found</Text>
              </View>
            )}
            <FlatList
              data={filteredBounties}
              renderItem={renderBountyItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.listContainer, { paddingBottom: 80 }]}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              style={styles.flatList}
            />
          </>

      }


      {showWalkthrough && (
        <Walkthrough steps={steps} onFinish={() => setShowWalkthrough(false)} />
      )}
    </View>
  );
}

const getStatusColor = (status: Bounty["status"]) => {
  switch (status) {
    case "APPROVED":
      return "#4CAF50";
    case "PENDING":
      return "#FFC107";
    case "REJECTED":
      return "#F44336";
    default:
      return "#9E9E9E";
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: Color.wadzzo,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 8,
  },
  title: {
    alignItems: "center",
  },
  listContainer: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  detailsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: "flex-start",
  },
  selectedMenuItem: {
    fontWeight: "bold", // Bold text for selected option
    backgroundColor: Color.dark.primary, // Background color for selected option
    fontStyle: "italic", // Italic text for selected option
    borderRadius: 8, // Rounded corners for selected option
  },
  prizeText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  participantsText: {
    fontSize: 14,
    marginTop: 8,
  },
  winnerText: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
    color: "#4CAF50",
  },
  flatList: {
    flex: 1,
  },
  cardCover: {
    height: 200,
  },
});
