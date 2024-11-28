import PlayerCardMini from './PlayerCardMini';
import './PlayerCard.css'

import splitNameNumber from "../Helpers/splitNameNumber";

function ProfileMini({info}) {
    function redirect() {
        const user = splitNameNumber(info.player + info.number);
        return `/user/${user.name}/${user.number}`;
    }
    let timestamp = info.last_updated;
    if (info.timestamp) {
        timestamp = new Date(parseInt(info.timestamp) * 1000).toLocaleDateString();
    }
    return (
        <a
          href={redirect()}
          rel="noopener noreferrer"
          className="container-mini mt-3 text-decoration-none d-block"
          style={{ minWidth: '350px', maxHeight: '115px' }}
        >
          <div className="d-flex justify-content-between align-items-center ms-1 w-100">
            <div className="px-2 pt-2 mb-2 ms-1">
              <PlayerCardMini info={info} />
            </div>
          </div>
          <i
            className="Update-mini position-relative ms-2"
            style={{ bottom: '25px', float: 'right', right: '10px' }}
          >
            Last Synced: {timestamp}
          </i>
        </a>
    );
}

export default ProfileMini;