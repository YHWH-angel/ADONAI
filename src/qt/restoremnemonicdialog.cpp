// Copyright (c) 2025 The Adonai Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#include <bitcoin-build-config.h> // IWYU pragma: keep

#include <qt/restoremnemonicdialog.h>
#include <qt/forms/ui_restoremnemonicdialog.h>
#include <qt/guiutil.h>

#include <wallet/bip39.h>
#include <wallet/wordlist_en.h>
#include <util/memory.h>

#include <QPushButton>

RestoreMnemonicDialog::RestoreMnemonicDialog(QWidget* parent) :
    QDialog(parent, GUIUtil::dialog_flags),
    ui(new Ui::RestoreMnemonicDialog)
{
    ui->setupUi(this);
    ui->buttonBox->button(QDialogButtonBox::Ok)->setText(tr("Restore"));
    ui->buttonBox->button(QDialogButtonBox::Ok)->setEnabled(false);

    ui->preset_combo->addItem(tr("Segwit bech32 (BIP84)"));
    ui->preset_combo->addItem(tr("Taproot (BIP86)"));
    ui->preset_combo->setItemData(1, 0, Qt::UserRole - 1);
    ui->preset_combo->addItem(tr("Custom…"));

    ui->derivation_edit->setText("m/84'/5353'/0'");
    ui->derivation_edit->setVisible(false);

    connect(ui->preset_combo, QOverload<int>::of(&QComboBox::currentIndexChanged), [this](int index){
        ui->derivation_edit->setVisible(index == 2);
        if (index == 0) ui->derivation_edit->setText("m/84'/5353'/0'");
        if (index == 1) ui->derivation_edit->setText("m/86'/5353'/0'");
    });

    connect(ui->wallet_name_edit, &QLineEdit::textChanged, this, &RestoreMnemonicDialog::updateOkButton);
    connect(ui->mnemonic_edit, &QPlainTextEdit::textChanged, this, &RestoreMnemonicDialog::updateOkButton);
}

RestoreMnemonicDialog::~RestoreMnemonicDialog()
{
    delete ui;
}

void RestoreMnemonicDialog::updateOkButton()
{
    std::vector<std::string> wordlist(std::begin(BIP39_WORDLIST_EN), std::end(BIP39_WORDLIST_EN));
    std::string text = ui->mnemonic_edit->toPlainText().toStdString();
    bool valid = BIP39_ValidateMnemonic(text, wordlist);
    memory_cleanse(text.data(), text.size());
    bool enable = valid && !ui->wallet_name_edit->text().isEmpty();
    ui->buttonBox->button(QDialogButtonBox::Ok)->setEnabled(enable);
}

QString RestoreMnemonicDialog::walletName() const
{
    return ui->wallet_name_edit->text();
}

QString RestoreMnemonicDialog::mnemonic() const
{
    return ui->mnemonic_edit->toPlainText();
}

QString RestoreMnemonicDialog::passphrase() const
{
    return ui->passphrase_edit->text();
}

QString RestoreMnemonicDialog::derivationPath() const
{
    return ui->derivation_edit->text();
}

int RestoreMnemonicDialog::rescanHeight() const
{
    return ui->rescan_spinbox->value();
}

bool RestoreMnemonicDialog::disablePrivateKeys() const
{
    return ui->watchonly_checkbox->isChecked();
}
