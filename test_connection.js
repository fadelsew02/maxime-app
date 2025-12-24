// Test de connexion à l'API
async function testConnection() {
    console.log('Test de connexion à l\'API...');
    
    try {
        // Test de connexion
        const loginResponse = await fetch('http://127.0.0.1:8000/api/auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'receptionniste',
                password: 'password123'
            })
        });
        
        if (loginResponse.ok) {
            const tokens = await loginResponse.json();
            console.log('✓ Connexion réussie');
            
            // Test récupération des échantillons
            const echantillonsResponse = await fetch('http://127.0.0.1:8000/api/echantillons/', {
                headers: {
                    'Authorization': `Bearer ${tokens.access}`,
                    'Content-Type': 'application/json',
                },
            });
            
            if (echantillonsResponse.ok) {
                const data = await echantillonsResponse.json();
                console.log(`✓ ${data.results.length} échantillons récupérés`);
                
                // Afficher quelques échantillons
                console.log('\nPremiers échantillons:');
                data.results.slice(0, 5).forEach(ech => {
                    console.log(`- ${ech.code} (${ech.client_nom}) - ${ech.statut}`);
                });
                
                // Test données groupées par client
                const groupedResponse = await fetch('http://127.0.0.1:8000/api/echantillons/grouped_by_client/', {
                    headers: {
                        'Authorization': `Bearer ${tokens.access}`,
                        'Content-Type': 'application/json',
                    },
                });
                
                if (groupedResponse.ok) {
                    const groupedData = await groupedResponse.json();
                    console.log(`\n✓ ${groupedData.length} clients avec échantillons`);
                    
                    console.log('\nClients:');
                    groupedData.slice(0, 3).forEach(client => {
                        console.log(`- ${client.client_nom}: ${client.nombre_echantillons} échantillon(s)`);
                    });
                } else {
                    console.log('✗ Erreur récupération données groupées');
                }
                
            } else {
                console.log('✗ Erreur récupération échantillons');
            }
        } else {
            console.log('✗ Erreur de connexion');
        }
    } catch (error) {
        console.log('✗ Serveur non accessible:', error.message);
        console.log('\nPour démarrer le serveur:');
        console.log('cd backend');
        console.log('python manage.py runserver 8000');
    }
}

testConnection();