// Copyright (c) 2025 The Adonai Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#ifndef BITCOIN_QT_RESTOREMNEMONICDIALOG_H
#define BITCOIN_QT_RESTOREMNEMONICDIALOG_H

#include <QDialog>
#include <QEvent>

namespace Ui {
class RestoreMnemonicDialog;
}

class RestoreMnemonicDialog : public QDialog
{
    Q_OBJECT

public:
    explicit RestoreMnemonicDialog(QWidget* parent = nullptr);
    ~RestoreMnemonicDialog();

    QString walletName() const;
    QString mnemonic() const;
    QString passphrase() const;
    QString derivationPath() const;
    int rescanHeight() const;
    bool disablePrivateKeys() const;

protected:
    bool eventFilter(QObject* obj, QEvent* event) override;

private:
    Ui::RestoreMnemonicDialog* ui;
    void updateOkButton();
};

#endif // BITCOIN_QT_RESTOREMNEMONICDIALOG_H
