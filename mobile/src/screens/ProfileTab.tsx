import { useProfile } from '../store/ProfileContext';
import ProfileScreen from './ProfileScreen';

export default function ProfileTab() {
  const { profile, saveProfile } = useProfile();
  if (!profile) return null;
  return <ProfileScreen profile={profile} onSave={saveProfile} onClose={() => {}} />;
}
