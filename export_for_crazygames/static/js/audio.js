class AudioManager {
    constructor() {
        this.initialized = false;

        // Main synthesizer for sound effects
        this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
        this.synth.volume.value = -10;

        // Effects chain
        this.reverb = new Tone.Reverb(1.5).toDestination();
        this.delay = new Tone.FeedbackDelay("8n", 0.5).toDestination();
        this.synth.connect(this.reverb);
        this.synth.connect(this.delay);

        // Background music sequencer
        const melodyNotes = ["C4", "E4", "G4", "A4"];
        this.backgroundMusic = new Tone.Sequence((time, note) => {
            this.synth.triggerAttackRelease(note, "8n", time, 0.3);
        }, melodyNotes, "4n");

        // Create ambient pad
        this.pad = new Tone.FMSynth({
            harmonicity: 2,
            modulationIndex: 3.5,
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.5,
                decay: 0.5,
                sustain: 0.5,
                release: 1
            }
        }).toDestination();
        this.pad.volume.value = -20;

        // Ambient pad pattern
        this.padPattern = new Tone.Loop(time => {
            this.pad.triggerAttackRelease("C2", "2n", time);
            this.pad.triggerAttackRelease("G2", "2n", time + 2);
        }, "4n");
    }

    async initialize() {
        if (!this.initialized) {
            await Tone.start();
            Tone.Transport.bpm.value = 120;
            this.initialized = true;
        }
    }

    playCollision() {
        const now = Tone.now();
        // Create an explosive sound effect
        this.synth.triggerAttackRelease("C2", "32n", now, 1);
        this.synth.triggerAttackRelease("G1", "16n", now + 0.05, 0.8);
        this.synth.triggerAttackRelease("E1", "8n", now + 0.1, 0.6);
    }

    playPowerup() {
        const now = Tone.now();
        // Create a sparkly ascending sound
        this.synth.triggerAttackRelease("C5", "16n", now, 0.7);
        this.synth.triggerAttackRelease("E5", "16n", now + 0.05, 0.7);
        this.synth.triggerAttackRelease("G5", "16n", now + 0.1, 0.7);
        this.synth.triggerAttackRelease("C6", "8n", now + 0.15, 0.5);
    }

    playObstaclePass() {
        const now = Tone.now();
        // Create a whoosh sound
        this.synth.triggerAttackRelease("G4", "32n", now, 0.3);
    }

    startBackgroundMusic() {
        Tone.Transport.start();
        this.backgroundMusic.start(0);
        this.padPattern.start(0);
    }

    stopBackgroundMusic() {
        this.backgroundMusic.stop();
        this.padPattern.stop();
        Tone.Transport.stop();
    }

    adjustVolume(volume) {
        // Volume should be between -60 and 0
        this.synth.volume.value = volume;
        this.pad.volume.value = volume - 10;
    }
}