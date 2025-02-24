export default {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    verify: 'Verify',
    copy: 'Copy',
    back: 'Back',
  },
  home: {
    title: 'Bitcoin Wallet',
    recentTransactions: 'Recent Transactions',
    viewAll: 'View All',
    noTransactions: 'No transactions yet',
    totalBalance: 'Total Balance',
    pendingBalance: '(includes ₿ {{amount}} pending)',
  },
  transactions: {
    title: 'Transactions',
    received: 'Received',
    sent: 'Sent',
    pending: 'pending',
    confirmed: 'confirmed',
    loadMore: 'Load More',
  },
  settings: {
    title: 'Settings',
    theme: 'Theme',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    themeSystem: 'System Default',
    activity: 'Activity',
    currentIndex: 'Current Index',
    currentAddress: 'Current Address',
    nextAddress: 'Next Address',
    resetWallet: 'Reset Wallet',
    resetConfirm: 'Are you sure you want to remove the xpub and all wallet data?',
    exportSeed: 'See Recovery Phrase',
    noSeedStored: 'No recovery phrase stored',
    confirmExport: 'Are you sure you want to show your recovery phrase?',
    seedPhrase: 'Recovery Phrase',
    currency: 'Currency',
    selectCurrency: 'Select display currency',
  },
  import: {
    title: 'Import Wallet',
    placeholder: 'Enter xpub/ypub/zpub or your 12/24 words mnemonic',
    import: 'Import',
    invalidInput: 'Invalid xpub or mnemonic',
    generateSeed: 'New Wallet',
    backupSeed: 'Backup Your Recovery Phrase',
    seedWarning: 'Write down these 12 words in order. Never share them with anyone.',
    verifySeed: 'Verify your seed',
    enterSeed: 'Enter your recovery phrase to verify',
    verifySubtitle: 'Verify your recovery phrase to ensure it is correct. You will be able to export it later.',
    seedMismatch: 'Recovery phrase does not match',
    copySeed: 'Copy Recovery Phrase',
    seedCopied: 'Recovery phrase copied to clipboard',
  },
  payment: {
    title: 'Request Payment',
    amount: 'Amount',
    continue: 'Continue',
    newRequest: 'New Request',
    copyAddress: 'Copy Address',
    addressCopied: 'Address copied to clipboard',
    received: 'Payment Received!',
  },
  welcome: {
    title: 'Welcome to Tsunami',
    subtitle: 'Accept Bitcoin in your shop',
  },
}; 