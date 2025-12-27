#!/usr/bin/env python3
"""
Script pour supprimer toutes les utilisations de localStorage
sauf les tokens d'authentification (access_token, refresh_token, user)
"""

import os
import re

# Fichiers à nettoyer
FILES_TO_CLEAN = [
    "src/components/DashboardHome.tsx",
    "src/components/modules/AdminModule.tsx",
    "src/components/modules/ServiceMarketingModule.tsx",
    "src/components/modules/EssaisRejetesModule.tsx",
    "src/components/modules/EssaisRejetesMecaniqueModule.tsx",
    "src/components/modules/ChefProjetRejeteModule.tsx",
    "src/components/modules/ChefServiceModule.tsx",
    "src/components/modules/ValidationResultsModule.tsx",
    "src/components/MarketingDashboard.tsx",
    "src/lib/mockData.ts",
]

# Patterns à supprimer (sauf auth)
PATTERNS_TO_REMOVE = [
    # Lecture localStorage clients
    r"const savedClients = localStorage\.getItem\('clients'\);",
    r"localStorage\.getItem\('clients'\)",
    
    # Écriture localStorage clients
    r"localStorage\.setItem\('clients', JSON\.stringify\(.*?\)\);",
    
    # Lecture localStorage échantillons
    r"const savedEchantillons = localStorage\.getItem\('echantillons'\);",
    r"localStorage\.getItem\('echantillons'\)",
    
    # Écriture localStorage échantillons
    r"localStorage\.setItem\('echantillons', JSON\.stringify\(.*?\)\);",
    
    # Lecture localStorage rapports
    r"localStorage\.getItem\(.*?rapport.*?\)",
    r"localStorage\.setItem\(.*?rapport.*?\)",
    
    # Lecture localStorage essais
    r"localStorage\.getItem\(essai.*?\)",
    r"localStorage\.setItem\(essai.*?\)",
]

def clean_file(filepath):
    """Nettoie un fichier des utilisations localStorage illégitimes"""
    if not os.path.exists(filepath):
        print(f"❌ Fichier non trouvé: {filepath}")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Supprimer les patterns
    for pattern in PATTERNS_TO_REMOVE:
        content = re.sub(pattern, '', content)
    
    # Supprimer les lignes vides multiples
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Nettoyé: {filepath}")
        return True
    else:
        print(f"⏭️  Aucun changement: {filepath}")
        return False

def main():
    print("🧹 Nettoyage localStorage...")
    print("=" * 60)
    
    cleaned_count = 0
    for filepath in FILES_TO_CLEAN:
        if clean_file(filepath):
            cleaned_count += 1
    
    print("=" * 60)
    print(f"✨ Terminé! {cleaned_count}/{len(FILES_TO_CLEAN)} fichiers nettoyés")
    print("\n⚠️  IMPORTANT: Seuls les tokens d'authentification restent dans localStorage:")
    print("   - access_token")
    print("   - refresh_token")
    print("   - user")

if __name__ == "__main__":
    main()
