function freqToNoteName(frequency) {
    const noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteNumber = 12 * (Math.log(frequency / 440) / Math.log(2));
    const midiNumber = Math.round(noteNumber) + 69;
    const noteIndex = midiNumber % 12;
    const octave = Math.floor(midiNumber / 12) - 1;
    return `${noteStrings[noteIndex]}${octave}`;
}

export default freqToNoteName;
