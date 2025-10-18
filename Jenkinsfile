pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        sh 'echo Building...'
        echo "123"
      }
    }
    stage('Test') {
      steps {
        sh 'echo Testing...'
      }
    } 
    stage('Deploy') {
      steps { 
        sh 'echo Deploying...'
      }
    }
  }
  post {
    always {
      echo "Pipeline finished!"
    }
  }
}