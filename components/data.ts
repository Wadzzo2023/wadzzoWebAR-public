import { AnimationObject } from 'lottie-react-native';

export interface OnboardingData {
  id: number;
  animation: AnimationObject;
  text: string;
  description: string;
  textColor: string;
  backgroundColor: string;
}

const onBoardData: OnboardingData[] = [
  {
    id: 1,
    animation: require('../assets//animation/explore.json'),
    text: 'Explore',
    description: "Open wadzzo to start your journey to explore the world of rewards and prizes",
    textColor: '#F15937',
    backgroundColor: '#C8E6B3',
  },
  {
    id: 2,
    animation: require('../assets//animation/collect.json'),
    text: 'Collect',
    description: "Collect items and rewards from your favorite brands.",
    textColor: '#1e2169',
    backgroundColor: '#bae4fd',
  },
  {
    id: 3,
    animation: require('../assets/animation/win.json'),
    text: 'Win',
    description: "Win Prizes, bounties and rewards from your favorite local and national brands",
    textColor: '#005b4f',
    backgroundColor: '#12C7A0',
  },
];

export default onBoardData;
