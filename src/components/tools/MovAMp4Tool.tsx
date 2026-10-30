import VideoToMp4Base from '@/components/tools/VideoToMp4Base';
import { withLang } from '@/i18n/react';

function MovAMp4Tool() {
  return <VideoToMp4Base sourceLabel="MOV" />;
}

export default withLang(MovAMp4Tool);
