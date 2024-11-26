let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

let config = {
    appid: "f12e244d94b3425fb92022bee5fc3588",
    token: "007eJxTYBBcq9N8LCO8OubQEd+bYtbTtsz4LhQfrXvlyzO5UM+lD1QUGNIMjVKNTExSLE2SjE2MTNOSLI0MjIySUlNN05KNTS0sptq4pDcEMjKEXhRnYmSAQBCfkyE3NSUzvSgxr4SBAQDPtSCl",
    uid: null,
    channel: "medigrant",
};

let localTracks = {
    audioTrack: null,
    videoTrack: null,
};

let localTrackState = {
    audioTrackMuted: false,
    videoTrackMuted: false,
};

let remoteUsers = {}; // Store all remote users' tracks

// Join button click event
document.getElementById("join-btn").addEventListener("click", async () => {
    config.uid = Math.floor(Math.random() * 10000); // Unique UID for each user
    await joinStreams();
    document.getElementById("join-wrapper").style.display = "none";
    document.getElementById("footer").style.display = "flex";
});

// Microphone button click event
document.getElementById("mic-btn").addEventListener("click", async () => {
    if (!localTrackState.audioTrackMuted) {
        await localTracks.audioTrack.setMuted(true);
        localTrackState.audioTrackMuted = true;
        document.getElementById("mic-btn").style.backgroundColor = "rgb(255, 80, 80, 0.7)";
    } else {
        await localTracks.audioTrack.setMuted(false);
        localTrackState.audioTrackMuted = false;
        document.getElementById("mic-btn").style.backgroundColor = "#1f1f1f8e";
    }
});

// Camera button click event
document.getElementById("camera-btn").addEventListener("click", async () => {
    if (!localTrackState.videoTrackMuted) {
        await localTracks.videoTrack.setMuted(true);
        localTrackState.videoTrackMuted = true;
        document.getElementById("camera-btn").style.backgroundColor = "rgb(255, 80, 80, 0.7)";
    } else {
        await localTracks.videoTrack.setMuted(false);
        localTrackState.videoTrackMuted = false;
        document.getElementById("camera-btn").style.backgroundColor = "#1f1f1f8e";
    }
});

// Leave button click event
document.getElementById("leave-btn").addEventListener("click", async () => {
    for (let trackName in localTracks) {
        let track = localTracks[trackName];
        if (track) {
            track.stop();
            track.close();
            localTracks[trackName] = null;
        }
    }
    await client.leave();
    remoteUsers = {}; // Clear remote users
    document.getElementById("footer").style.display = "none";
    document.getElementById("user-streams").innerHTML = "";
    document.getElementById("join-wrapper").style.display = "block";
});

// Join streams and handle local video/audio
let joinStreams = async () => {
    client.on("user-published", handleUserPublished);
    client.on("user-left", handleUserLeft);

    [config.uid, localTracks.audioTrack, localTracks.videoTrack] = await Promise.all([
        client.join(config.appid, config.channel, config.token || null, config.uid || null),
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack(),
    ]);

    // Add local user video to the DOM
    let player = `
        <div class="video-containers" id="video-wrapper-${config.uid}">
            <p class="user-uid">${config.uid}</p>
            <div class="video-player player" id="stream-${config.uid}"></div>
        </div>`;
    document.getElementById("user-streams").insertAdjacentHTML("beforeend", player);
    localTracks.videoTrack.play(`stream-${config.uid}`);

    // Publish local tracks
    await client.publish([localTracks.audioTrack, localTracks.videoTrack]);
};

// Handle remote user publishing
let handleUserPublished = async (user, mediaType) => {
    const id = user.uid;
    remoteUsers[id] = user;

    await client.subscribe(user, mediaType);

    if (mediaType === "video") {
        let player = document.getElementById(`video-wrapper-${id}`);
        if (!player) {
            player = `
                <div class="video-containers" id="video-wrapper-${id}">
                    <p class="user-uid">${id}</p>
                    <div class="video-player player" id="stream-${id}"></div>
                </div>`;
            document.getElementById("user-streams").insertAdjacentHTML("beforeend", player);
        }
        user.videoTrack.play(`stream-${id}`);
    }

    if (mediaType === "audio") {
        user.audioTrack.play();
    }
};

// Handle remote user leaving
let handleUserLeft = (user) => {
    const id = user.uid;
    delete remoteUsers[id];
    const player = document.getElementById(`video-wrapper-${id}`);
    if (player) player.remove();
};
