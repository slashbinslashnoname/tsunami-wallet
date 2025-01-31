# Boilerplate for React Native with BitcoinJS Library

This is a boilerplate for React Native with BitcoinJS Library. It includes a simple UI to generate a Bitcoin address.

## Features

- Generates Bitcoin mainnet addresses
- Displays public key and address
- Error handling and user feedback
- Native SegWit (P2WPKH) address format

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- React Native development environment

## Install and run

1. Clone the repository
2. Run `npm install`
3. Run `npm run ios` or `npm run android`

## Dependencies

- `bitcoinjs-lib`: Bitcoin library for address generation
- `@bitcoinerlab/secp256k1`: Elliptic curve cryptography implementation
- `react-native-get-random-values`: Cryptographic random number generation
- `buffer`: Buffer implementation for React Native
- `process`: Process polyfill for React Native

## Development

The project uses TypeScript for type safety and follows React Native best practices. Key components:

- `BitcoinService`: Handles Bitcoin address generation
- `crypto-setup.ts`: Sets up required crypto polyfills
- `App.tsx`: Main UI component with address display and generation

## Usage

1. Launch the app
2. The app will automatically generate an initial address
3. Tap "Generate Address" to create a new Bitcoin address
4. The address and any errors will be displayed on screen

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request